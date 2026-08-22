import { sendVerificationEmail } from './utils/email.js';

function createResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers,
    },
  });
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

async function hashPassword(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
  );
  const saltBuf = enc.encode("univgov-salt-v1"); // fixed salt for simplicity in this demo
  const buffer = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBuf, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function extractSessionToken(authHeader = '') {
  if (!authHeader) return '';
  return authHeader.replace(/^Bearer\s+/i, '').trim();
}

function formatCitizen(user) {
  return {
    id: user.citizen_id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url || null,
    emailVerified: Boolean(user.email_verified),
    status: user.status || 'active',
    uniBalance: typeof user.uni_balance === 'number' ? user.uni_balance : 1000000,
    lnAddress: user.ln_address || '',
    btcAddress: user.btc_address || '',
    btcSalaryRate: user.btc_salary_rate || 0,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
  };
}

async function ensureUniSchema(env) {
  if (!env || !env.DB) return;
  try {
    await env.DB.prepare('ALTER TABLE citizens ADD COLUMN uni_balance INTEGER NOT NULL DEFAULT 1000000').run();
  } catch (e) {}
  try {
    await env.DB.prepare('ALTER TABLE citizens ADD COLUMN password_hash TEXT').run();
  } catch (e) {}
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS uni_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tx_id TEXT UNIQUE NOT NULL,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        memo TEXT,
        created_at TEXT NOT NULL
      )
    `).run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_uni_tx_sender ON uni_transactions(sender_id)').run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_uni_tx_receiver ON uni_transactions(receiver_id)').run();
  } catch (e) {}
}

async function getCitizenBySession(token, env) {
  if (!token) return null;
  if (!env.DB) {
    if (token.startsWith('dev-session-')) {
      return {
        citizen_id: 'UNIV-2026-DEV01',
        name: 'Dev Citizen',
        email: 'dev@univgov.org',
        avatar_url: '',
        email_verified: 1,
        status: 'active',
        uni_balance: 1000000,
        created_at: new Date().toISOString(),
      };
    }
    return null;
  }
  await ensureUniSchema(env);
  const session = await env.DB.prepare(
    'SELECT s.*, c.* FROM sessions s JOIN citizens c ON s.citizen_id = c.citizen_id WHERE s.token = ? AND s.expires_at > ?'
  ).bind(token, new Date().toISOString()).first();
  return session;
}

async function createSession(citizenId, env) {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  if (env.DB) {
    await env.DB.prepare(
      'INSERT INTO sessions (token, citizen_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
    ).bind(token, citizenId, expiresAt, createdAt).run();
  }
  return { token, expiresAt };
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || '';

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    await ensureUniSchema(env);

    // -------------------------------------------------------------
    // GET /api/auth?action=me
    // -------------------------------------------------------------
    if (request.method === 'GET' && action === 'me') {
      const authHeader = request.headers.get('Authorization') || '';
      const sessionToken = extractSessionToken(authHeader);
      
      if (!sessionToken) {
        return createResponse({ error: 'Unauthorized', authenticated: false }, 401);
      }

      const user = await getCitizenBySession(sessionToken, env);
      if (!user) {
        return createResponse({ error: 'Session expired or invalid', authenticated: false }, 401);
      }

      return createResponse({
        authenticated: true,
        citizen: formatCitizen(user),
      });
    }

    // -------------------------------------------------------------
    // POST /api/auth?action=verify (Verify token from email link)
    // -------------------------------------------------------------
    if (request.method === 'POST' && action === 'verify') {
      const body = await request.json();
      const token = (body.token || '').trim();
      const email = (body.email || '').trim().toLowerCase();

      if (!token || !email) {
        return createResponse({ error: 'Token and email are required' }, 400);
      }

      if (!env.DB) {
        return createResponse({
          success: true,
          message: 'メール認証が完了しました（開発モード）。',
          sessionToken: 'dev-session-' + Date.now(),
          citizen: {
            id: 'UNIV-2026-DEV01',
            name: email.split('@')[0],
            email: email,
            emailVerified: true,
            uniBalance: 1000000,
            createdAt: new Date().toISOString(),
          },
        });
      }

      const citizen = await env.DB.prepare(
        'SELECT * FROM citizens WHERE email = ? AND verification_token = ?'
      ).bind(email, token).first();

      if (!citizen) {
        return createResponse({ error: '認証トークンが無効であるか、期限が切れています。' }, 400);
      }

      const nowIso = new Date().toISOString();

      await env.DB.prepare(
        'UPDATE citizens SET email_verified = 1, verification_token = NULL, token_expires_at = NULL, last_login_at = ?, updated_at = ? WHERE id = ?'
      ).bind(nowIso, nowIso, citizen.id).run();

      const session = await createSession(citizen.citizen_id, env);

      return createResponse({
        success: true,
        message: 'メールアドレスの認証が完了しました。',
        sessionToken: session.token,
        citizen: formatCitizen({ ...citizen, email_verified: 1 }),
      });
    }

    // -------------------------------------------------------------
    // POST /api/auth?action=login (Password Login)
    // -------------------------------------------------------------
    if (request.method === 'POST' && action === 'login') {
      const body = await request.json();
      const email = (body.email || '').trim().toLowerCase();
      const password = (body.password || '').trim();

      if (!email || !email.includes('@')) {
        return createResponse({ error: '有効なメールアドレスを入力してください。' }, 400);
      }
      if (!password) {
        return createResponse({ error: 'パスワードを入力してください。' }, 400);
      }

      let citizen = null;
      if (env.DB) {
        citizen = await env.DB.prepare('SELECT * FROM citizens WHERE email = ?').bind(email).first();
      }

      if (!citizen) {
        return createResponse({ error: 'ユーザーが見つからないか、パスワードが間違っています。' }, 401);
      }

      const hashedPw = await hashPassword(password);
      if (citizen.password_hash !== hashedPw) {
        return createResponse({ error: 'ユーザーが見つからないか、パスワードが間違っています。' }, 401);
      }

      const nowIso = new Date().toISOString();
      const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      if (env.DB) {
        await env.DB.prepare(
          'UPDATE citizens SET last_login_at = ? WHERE id = ?'
        ).bind(nowIso, citizen.id).run();

        await env.DB.prepare(
          'INSERT INTO sessions (token, citizen_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
        ).bind(sessionToken, citizen.citizen_id, sessionExpiresAt, nowIso).run();
      }

      return createResponse({
        success: true,
        authenticated: true,
        sessionToken: sessionToken,
        message: 'ログインしました。マイポータルへ移動します。',
        citizen: formatCitizen(citizen),
      });
    }

    // -------------------------------------------------------------
    // POST /api/auth?action=google (Google One-Tap / OAuth Token)
    // -------------------------------------------------------------
    if (request.method === 'POST' && action === 'google') {
      const body = await request.json();
      const credential = body.credential || '';
      let googleId = '';
      let email = '';
      let name = '';
      let avatarUrl = '';

      if (credential) {
        const payload = parseJwt(credential);
        if (!payload || !payload.email) {
          return createResponse({ error: 'Invalid Google token' }, 400);
        }
        googleId = payload.sub || '';
        email = (payload.email || '').toLowerCase();
        name = payload.name || payload.given_name || email.split('@')[0];
        avatarUrl = payload.picture || '';
      } else if (body.userInfo && body.userInfo.email) {
        googleId = body.userInfo.sub || body.userInfo.id || '';
        email = (body.userInfo.email || '').toLowerCase();
        name = body.userInfo.name || body.userInfo.given_name || email.split('@')[0];
        avatarUrl = body.userInfo.picture || '';
      } else if (body.access_token) {
        try {
          const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${body.access_token}` },
          });
          if (userRes.ok) {
            const uData = await userRes.json();
            googleId = uData.sub || '';
            email = (uData.email || '').toLowerCase();
            name = uData.name || uData.given_name || email.split('@')[0];
            avatarUrl = uData.picture || '';
          } else {
            return createResponse({ error: 'Failed to verify Google access token' }, 400);
          }
        } catch (err) {
          return createResponse({ error: 'Google verification failed' }, 400);
        }
      } else {
        return createResponse({ error: 'Google credential or access token is required' }, 400);
      }

      if (!email) {
        return createResponse({ error: 'Email could not be retrieved from Google' }, 400);
      }

      const nowIso = new Date().toISOString();
      let citizen = null;
      if (env.DB) {
        citizen = await env.DB.prepare(
          'SELECT * FROM citizens WHERE google_id = ? OR email = ?'
        ).bind(googleId || email, email).first();
      }

      // Use Email directly as Citizen ID
      const citizenId = email;

      if (env.DB) {
        if (citizen) {
          await env.DB.prepare(
            'UPDATE citizens SET citizen_id = ?, google_id = ?, avatar_url = ?, last_login_at = ?, updated_at = ? WHERE id = ?'
          ).bind(citizenId, googleId || citizen.google_id, avatarUrl || citizen.avatar_url, nowIso, nowIso, citizen.id).run();
        } else {
          // New citizen: Grant default 10^6 UNI initial allocation
          await env.DB.prepare(
            'INSERT INTO citizens (citizen_id, name, email, google_id, avatar_url, email_verified, uni_balance, created_at, updated_at, last_login_at) VALUES (?, ?, ?, ?, ?, 1, 1000000, ?, ?, ?)'
          ).bind(citizenId, name, email, googleId, avatarUrl, nowIso, nowIso, nowIso).run();

          // Record Genesis Grant Transaction
          const txId = 'tx_grant_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
          try {
            await env.DB.prepare(
              'INSERT INTO uni_transactions (tx_id, sender_id, receiver_id, amount, memo, created_at) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(txId, 'SYSTEM_GENESIS_GRANT', citizenId, 1000000, 'Cosmic Initial Grant (宇宙初期基本給 10^6 UNI)', nowIso).run();
          } catch (txErr) {
            console.warn('Genesis tx record error:', txErr);
          }
        }
      }

      const session = await createSession(citizenId, env);

      return createResponse({
        success: true,
        message: 'Googleアカウントでログインしました。',
        sessionToken: session.token,
        citizen: {
          id: citizenId,
          name: citizen ? citizen.name : name,
          email: email,
          avatarUrl: avatarUrl,
          emailVerified: true,
          status: citizen ? (citizen.status || 'active') : 'active',
          uniBalance: citizen ? (citizen.uni_balance ?? 1000000) : 1000000,
          createdAt: citizen ? citizen.created_at : nowIso,
        },
      });
    }

    // -------------------------------------------------------------
    // POST /api/auth?action=update (Update profile)
    // -------------------------------------------------------------
    if (request.method === 'POST' && action === 'update') {
      const authHeader = request.headers.get('Authorization') || '';
      const sessionToken = extractSessionToken(authHeader);
      const user = await getCitizenBySession(sessionToken, env);

      if (!user) {
        return createResponse({ error: 'Unauthorized' }, 401);
      }

      const body = await request.json();
      const newName = (body.name || user.name || '').trim().slice(0, 50);
      const lnAddress = (body.lnAddress || '').trim().slice(0, 100);
      const btcAddress = (body.btcAddress || '').trim().slice(0, 100);
      const btcSalaryRate = Math.min(100, Math.max(0, parseInt(body.btcSalaryRate, 10) || 0));

      if (!newName) {
        return createResponse({ error: 'Name is required' }, 400);
      }

      const nowIso = new Date().toISOString();
      if (env.DB) {
        try {
          await env.DB.prepare(
            'UPDATE citizens SET name = ?, ln_address = ?, btc_address = ?, btc_salary_rate = ?, updated_at = ? WHERE citizen_id = ?'
          ).bind(newName, lnAddress, btcAddress, btcSalaryRate, nowIso, user.citizen_id).run();
        } catch (dbErr) {
          await env.DB.prepare(
            'UPDATE citizens SET name = ?, updated_at = ? WHERE citizen_id = ?'
          ).bind(newName, nowIso, user.citizen_id).run();
        }
      }

      return createResponse({
        success: true,
        message: 'プロフィールおよびBitcoin受取設定を更新しました。',
        citizen: formatCitizen({
          ...user,
          name: newName,
          ln_address: lnAddress,
          btc_address: btcAddress,
          btc_salary_rate: btcSalaryRate,
          updated_at: nowIso,
        }),
      });
    }

    // -------------------------------------------------------------
    // POST /api/auth?action=transfer (Send Cosmic Currency UNI)
    // -------------------------------------------------------------
    if (request.method === 'POST' && action === 'transfer') {
      const authHeader = request.headers.get('Authorization') || '';
      const sessionToken = extractSessionToken(authHeader);
      const sender = await getCitizenBySession(sessionToken, env);

      if (!sender) {
        return createResponse({ error: 'Unauthorized' }, 401);
      }

      const body = await request.json();
      const recipientTarget = (body.to || '').trim().toLowerCase();
      const rawAmount = parseInt(body.amount, 10);
      const memo = (body.memo || '宇宙通貨 UNI 送金').trim().slice(0, 100);

      if (!recipientTarget) {
        return createResponse({ error: '送金先の宇宙国民IDまたはメールアドレスを入力してください。' }, 400);
      }

      if (isNaN(rawAmount) || rawAmount <= 0) {
        return createResponse({ error: '送金額は1以上の整数（UNI）で入力してください。' }, 400);
      }

      const senderBalance = typeof sender.uni_balance === 'number' ? sender.uni_balance : 1000000;
      if (senderBalance < rawAmount) {
        return createResponse({
          error: `残高が不足しています（現在の残高: ${senderBalance.toLocaleString()} UNI）。`
        }, 400);
      }

      if (sender.citizen_id.toLowerCase() === recipientTarget || (sender.email && sender.email.toLowerCase() === recipientTarget)) {
        return createResponse({ error: '自分自身に送金することはできません。' }, 400);
      }

      const nowIso = new Date().toISOString();
      const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

      if (!env.DB) {
        // Dev fallback
        return createResponse({
          success: true,
          message: `${rawAmount.toLocaleString()} UNI を送金しました（開発モード）。`,
          newBalance: senderBalance - rawAmount,
          tx: {
            txId,
            senderId: sender.citizen_id,
            receiverId: recipientTarget,
            amount: rawAmount,
            memo,
            createdAt: nowIso,
          }
        });
      }

      // Check recipient in DB
      let receiver = await env.DB.prepare(
        'SELECT * FROM citizens WHERE citizen_id = ? OR email = ?'
      ).bind(recipientTarget, recipientTarget).first();

      if (!receiver) {
        // If recipient is a valid identifier/email format, auto-provision receiver account with default grant
        if (recipientTarget.includes('@') && recipientTarget.includes('.')) {
          const receiverName = recipientTarget.split('@')[0];
          await env.DB.prepare(
            'INSERT INTO citizens (citizen_id, name, email, email_verified, uni_balance, created_at, updated_at) VALUES (?, ?, ?, 0, 1000000, ?, ?)'
          ).bind(recipientTarget, receiverName, recipientTarget, nowIso, nowIso).run();
          receiver = { citizen_id: recipientTarget, uni_balance: 1000000 };
        } else {
          return createResponse({ error: '指定された送金先の宇宙国民（ID/Email）が見つかりません。' }, 404);
        }
      }

      // Atomic balance update
      await env.DB.prepare(
        'UPDATE citizens SET uni_balance = uni_balance - ?, updated_at = ? WHERE citizen_id = ?'
      ).bind(rawAmount, nowIso, sender.citizen_id).run();

      await env.DB.prepare(
        'UPDATE citizens SET uni_balance = uni_balance + ?, updated_at = ? WHERE citizen_id = ?'
      ).bind(rawAmount, nowIso, receiver.citizen_id).run();

      // Record Transaction
      await env.DB.prepare(
        'INSERT INTO uni_transactions (tx_id, sender_id, receiver_id, amount, memo, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(txId, sender.citizen_id, receiver.citizen_id, rawAmount, memo, nowIso).run();

      return createResponse({
        success: true,
        message: `${rawAmount.toLocaleString()} UNI を ${receiver.citizen_id} へ送金しました。`,
        newBalance: senderBalance - rawAmount,
        tx: {
          txId,
          senderId: sender.citizen_id,
          receiverId: receiver.citizen_id,
          amount: rawAmount,
          memo,
          createdAt: nowIso,
        }
      });
    }

    // -------------------------------------------------------------
    // GET /api/auth?action=transactions (Get UNI Transaction History)
    // -------------------------------------------------------------
    if (request.method === 'GET' && action === 'transactions') {
      const authHeader = request.headers.get('Authorization') || '';
      const sessionToken = extractSessionToken(authHeader);
      const user = await getCitizenBySession(sessionToken, env);

      if (!user) {
        return createResponse({ error: 'Unauthorized' }, 401);
      }

      if (!env.DB) {
        return createResponse({
          success: true,
          transactions: [
            {
              id: 1,
              tx_id: 'tx_grant_genesis_mock',
              sender_id: 'SYSTEM_GENESIS_GRANT',
              receiver_id: user.citizen_id,
              amount: 1000000,
              memo: 'Cosmic Initial Grant (宇宙初期基本給 10^6 UNI)',
              created_at: user.created_at || new Date().toISOString(),
            }
          ]
        });
      }

      const { results } = await env.DB.prepare(
        'SELECT * FROM uni_transactions WHERE sender_id = ? OR receiver_id = ? ORDER BY id DESC LIMIT 50'
      ).bind(user.citizen_id, user.citizen_id).all();

      return createResponse({
        success: true,
        transactions: results || [],
      });
    }

    // -------------------------------------------------------------
    // POST /api/auth?action=logout
    // -------------------------------------------------------------
    if (request.method === 'POST' && action === 'logout') {
      const authHeader = request.headers.get('Authorization') || '';
      const sessionToken = extractSessionToken(authHeader);

      if (sessionToken && env.DB) {
        await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(sessionToken).run();
      }

      return createResponse({ success: true, message: 'ログアウトしました。' });
    }

    return createResponse({ error: 'Invalid action or method' }, 400);
  } catch (err) {
    console.error('Auth error:', err);
    return createResponse({ error: err.message }, 500);
  }
}
