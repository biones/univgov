import { sendVerificationEmail } from './utils/email.js';

async function hashPassword(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
  );
  const saltBuf = enc.encode("univgov-salt-v1");
  const buffer = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBuf, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const name = (body.name || '').trim().slice(0, 50);
    const email = (body.email || '').trim().toLowerCase().slice(0, 100);
    const password = (body.password || '').trim();

    if (!name) {
      return new Response(JSON.stringify({ error: '氏名または識別名は必須です。' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      return new Response(JSON.stringify({ error: '有効なメールアドレスを入力してください。' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (!password || password.length < 6) {
      return new Response(JSON.stringify({ error: 'パスワードは6文字以上で入力してください。' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const hashedPw = await hashPassword(password);
    const createdAt = new Date().toISOString();
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const userAgent = request.headers.get('User-Agent') || '';

    // Use Email directly as Citizen ID
    const finalCitizenId = email;

    // Generate 30-day Session Token for instant login
    const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (env.DB) {
      // Create tables or add column if not exists
      try {
        await env.DB.prepare('ALTER TABLE citizens ADD COLUMN password_hash TEXT').run();
      } catch (e) {}
      try {
        await env.DB.prepare('ALTER TABLE citizens ADD COLUMN uni_balance INTEGER NOT NULL DEFAULT 1000000').run();
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
      } catch (e) {}

      const existing = await env.DB.prepare('SELECT * FROM citizens WHERE email = ?').bind(email).first();
      
      if (existing) {
        await env.DB.prepare(
          'UPDATE citizens SET citizen_id = ?, password_hash = ?, name = ?, updated_at = ? WHERE email = ?'
        ).bind(finalCitizenId, hashedPw, name || existing.name, createdAt, email).run();
      } else {
        await env.DB.prepare(
          'INSERT INTO citizens (citizen_id, name, email, email_verified, password_hash, uni_balance, created_at, updated_at, ip, user_agent) VALUES (?, ?, ?, 1, ?, 1000000, ?, ?, ?, ?)'
        ).bind(finalCitizenId, name, email, hashedPw, createdAt, createdAt, ip, userAgent).run();

        // Initial Genesis Grant Tx
        const txId = 'tx_grant_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        try {
          await env.DB.prepare(
            'INSERT INTO uni_transactions (tx_id, sender_id, receiver_id, amount, memo, created_at) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(txId, 'SYSTEM_GENESIS_GRANT', finalCitizenId, 1000000, 'Cosmic Initial Grant (宇宙初期基本給 10^6 UNI)', createdAt).run();
        } catch (txErr) {}
      }

      // Save active session for instant login
      await env.DB.prepare(
        'INSERT INTO sessions (token, citizen_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
      ).bind(sessionToken, finalCitizenId, sessionExpiresAt, createdAt).run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        authenticated: true,
        sessionToken,
        message: '宇宙国民アカウントを発行し、ログインしました。',
        citizen: {
          id: finalCitizenId,
          name,
          email,
          status: 'active',
          emailVerified: true,
          uniBalance: 1000000,
          createdAt,
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    console.error('Registration error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
