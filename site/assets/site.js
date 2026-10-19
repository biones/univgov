const dialog = document.querySelector("[data-search-dialog]");
const searchInput = document.querySelector("[data-search-input]");
const searchResults = document.querySelector("[data-search-results]");
let searchIndex = [];

async function ensureIndex() {
  if (searchIndex.length) return;
  const lang = document.documentElement.lang || "ja";
  let response = await fetch(`/assets/search-index-${lang}.json`);
  if (!response.ok) {
    response = await fetch("/assets/search-index.json");
  }
  if (!response.ok) throw new Error("Search index could not be loaded");
  searchIndex = await response.json();
}

function resultMarkup(items) {
  const isEn = document.documentElement.lang === "en";
  if (!items.length) {
    return isEn ? '<p class="search-empty">No matching articles found.</p>' : '<p class="search-empty">一致する記事はありません。</p>';
  }
  return items.map((item) => `<a class="search-result" href="${item.url}"><small>${item.label}</small><b>${item.title}</b></a>`).join("");
}

async function openSearch() {
  if (!dialog) return;
  dialog.showModal();
  searchInput.focus();
  const isEn = document.documentElement.lang === "en";
  try {
    await ensureIndex();
    searchResults.innerHTML = resultMarkup(searchIndex);
  } catch {
    searchResults.innerHTML = isEn ? '<p class="search-empty">Could not load search index.</p>' : '<p class="search-empty">検索を読み込めませんでした。</p>';
  }
}

document.querySelectorAll("[data-search-open]").forEach((button) => button.addEventListener("click", openSearch));
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openSearch();
  }
});

searchInput?.addEventListener("input", () => {
  const query = searchInput.value.trim().toLocaleLowerCase("ja");
  const matches = query
    ? searchIndex.filter((item) => `${item.title} ${item.summary} ${item.label}`.toLocaleLowerCase("ja").includes(query))
    : searchIndex;
  searchResults.innerHTML = resultMarkup(matches);
});

const filter = document.querySelector("[data-card-filter]");
const cards = [...document.querySelectorAll("[data-article-card]")];
const emptyState = document.querySelector("[data-empty-state]");
filter?.addEventListener("input", () => {
  const query = filter.value.trim().toLocaleLowerCase("ja");
  let visible = 0;
  cards.forEach((card) => {
    const show = card.dataset.searchText.includes(query);
    card.hidden = !show;
    if (show) visible += 1;
  });
  if (emptyState) emptyState.hidden = visible !== 0;
});

const shareUrl = "https://univgov.pages.dev/";
const shareText = "宇宙政府｜土地は選べなくても、帰属は選べる。";
const shareNotice = document.querySelector("[data-share-notice]");

const shareLinks = {
  x: `https://x.com/intent/post?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`,
  bluesky: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`,
  line: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
};

document.querySelectorAll("[data-share-target]").forEach((link) => {
  link.href = shareLinks[link.dataset.shareTarget] ?? shareUrl;
});

function setShareNotice(message) {
  if (shareNotice) shareNotice.textContent = message;
}

document.querySelector("[data-copy-url]")?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareUrl);
    setShareNotice("リンクをコピーしました。投稿文に貼り付けてください。");
  } catch {
    setShareNotice(`リンク：${shareUrl}`);
  }
});

const nativeShare = document.querySelector("[data-native-share]");
if (navigator.share && nativeShare) {
  nativeShare.hidden = false;
  nativeShare.addEventListener("click", async () => {
    try {
      await navigator.share({ title: "宇宙政府", text: shareText, url: shareUrl });
    } catch {
      // Sharing is commonly dismissed by the user; no error message is needed.
    }
  });
}

// Article & Generic Link Copy Handler
document.querySelectorAll("[data-copy-link]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const isEn = document.documentElement.lang === "en";
    const targetUrl = btn.getAttribute("data-copy-link") || window.location.href;
    const span = btn.querySelector("span") || btn;
    const originalText = span.innerHTML;
    try {
      await navigator.clipboard.writeText(targetUrl);
      span.innerHTML = isEn ? "✓ Copied!" : "✓ コピー完了！";
      btn.style.borderColor = "#10b981";
      btn.style.color = "#10b981";
      setTimeout(() => {
        span.innerHTML = originalText;
        btn.style.borderColor = "";
        btn.style.color = "";
      }, 2500);
    } catch (e) {
      alert(targetUrl);
    }
  });
});

// ============================================================================
// Citizen Registration & Account Creation
// ============================================================================
// ============================================================================
// Google Sign-In & Authentication Handler (Global)
// ============================================================================
const GOOGLE_CLIENT_ID = "698222404877-286s6s3946n8rkqq3ihucsdogsq14pdo.apps.googleusercontent.com";
let googleTokenClient = null;

// Unified handler for Google Login (Credential or Access Token)
async function processGoogleAuthSuccess(authPayload) {
  const isEn = document.documentElement.lang === "en";
  const feedback = document.getElementById("citizen-register-feedback");
  const loginFeedback = document.getElementById("login-feedback-msg");

  if (feedback) {
    feedback.hidden = false;
    feedback.className = "citizen-feedback-box";
    feedback.innerHTML = `
      <div class="feedback-icon" style="font-size: 2.2rem; margin-bottom: 8px;">🚀</div>
      <h3 style="font-size: 1.2rem; margin: 0 0 8px 0; color: #fff;">${isEn ? "Authentication verified! Issuing Cosmic ID..." : "Google認証完了！宇宙国民証を発行中..."}</h3>
      <p style="color: #94a3b8; font-size: 0.95rem; margin: 0;">${isEn ? "Redirecting to My Portal..." : "マイポータルへ移動しています..."}</p>
    `;
  }
  if (loginFeedback) {
    loginFeedback.hidden = false;
    loginFeedback.className = "portal-alert success";
    loginFeedback.textContent = isEn ? "Signing in with Google..." : "Googleアカウントでログイン中...";
  }

  try {
    const res = await fetch("/api/auth?action=google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authPayload),
    });
    const data = await res.json();
    if (data.success && data.sessionToken) {
      localStorage.setItem("univgov_session", data.sessionToken);
      if (typeof window.gtag === "function") {
        window.gtag("event", data.citizen?.created_at ? "login" : "sign_up", { method: "Google" });
      }
      
      const authView = document.getElementById("portal-auth-view");
      if (authView && typeof window.renderPortalAuthenticatedUser === "function") {
        window.renderPortalAuthenticatedUser(data.citizen);
      } else {
        const targetPortal = isEn ? "/en/portal" : "/portal";
        setTimeout(() => {
          window.location.href = targetPortal;
        }, 400);
      }
    } else {
      const msg = data.error || (isEn ? "Google sign-in failed." : "Googleログインに失敗しました。");
      alert(msg);
      if (loginFeedback) {
        loginFeedback.className = "portal-alert error";
        loginFeedback.textContent = msg;
      }
      if (feedback) feedback.hidden = true;
    }
  } catch (e) {
    const msg = isEn ? "Google sign-in network error." : "Googleログイン通信エラーが発生しました。";
    alert(msg);
    if (loginFeedback) {
      loginFeedback.className = "portal-alert error";
      loginFeedback.textContent = msg;
    }
    if (feedback) feedback.hidden = true;
  }
}

// Global Google callback (GSI credential JWT)
window.handleGoogleLoginResponse = function(response) {
  if (!response || !response.credential) return;
  processGoogleAuthSuccess({ credential: response.credential });
};

// Initialize Google GIS & OAuth2 Token Client
function initGoogleAuthServices() {
  if (!window.google || !window.google.accounts) {
    // Retry after script load
    setTimeout(initGoogleAuthServices, 200);
    return;
  }

  // 1. Initialize Google Identity Services (GSI)
  try {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: window.handleGoogleLoginResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Render official Google button in portal & home if elements exist
    const gBtnHome = document.getElementById("g_id_signin_home") || document.querySelector(".g_id_signin");
    const gBtnPortal = document.getElementById("g_id_signin_portal");
    
    const btnOptions = {
      type: "standard",
      shape: "pill",
      theme: "filled_blue",
      text: "signin_with",
      size: "large",
      width: 280,
    };

    if (gBtnHome) {
      window.google.accounts.id.renderButton(gBtnHome, btnOptions);
    }
    if (gBtnPortal) {
      window.google.accounts.id.renderButton(gBtnPortal, btnOptions);
    }
  } catch (e) {
    console.warn("GSI init warning:", e);
  }

  // 2. Initialize OAuth2 Token Client for 100% reliable click triggers
  try {
    if (window.google.accounts.oauth2) {
      googleTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "openid email profile",
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            await processGoogleAuthSuccess({ access_token: tokenResponse.access_token });
          } else if (tokenResponse && tokenResponse.error) {
            console.warn("Google OAuth error:", tokenResponse.error);
          }
        },
      });
    }
  } catch (e) {
    console.warn("OAuth2 client init warning:", e);
  }
}

// Trigger Google Sign-In on Custom Button Click
function triggerGoogleLogin() {
  const isEn = document.documentElement.lang === "en";

  if (googleTokenClient) {
    // Request token with forced account chooser
    googleTokenClient.requestAccessToken({ prompt: "select_account" });
    return;
  }

  if (window.google && window.google.accounts && window.google.accounts.id) {
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // If One Tap is suppressed, fallback to OAuth URL popup
        openGoogleOAuthPopup();
      }
    });
    return;
  }

  openGoogleOAuthPopup();
}

// Direct OAuth2 popup fallback if GSI client is unavailable
function openGoogleOAuthPopup() {
  const isEn = document.documentElement.lang === "en";
  const redirectUri = window.location.origin + (isEn ? "/en/portal" : "/portal");
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent("openid email profile")}&prompt=select_account`;
  
  const width = 500;
  const height = 600;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;
  window.open(authUrl, "GoogleSignIn", `width=${width},height=${height},top=${top},left=${left}`);
}

// Parse Hash Token if returning from OAuth popup redirect
(function checkOAuthHashToken() {
  if (window.location.hash && window.location.hash.includes("access_token=")) {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");
    if (accessToken) {
      window.history.replaceState({}, document.title, window.location.pathname);
      processGoogleAuthSuccess({ access_token: accessToken });
    }
  }
})();

// Attach event listeners to buttons
function setupGoogleAuthTriggers() {
  initGoogleAuthServices();

  const triggerBtns = [
    document.getElementById("btn-custom-google-login"),
    document.getElementById("btn-portal-google-login")
  ];

  triggerBtns.forEach(btn => {
    btn?.addEventListener("click", (e) => {
      e.preventDefault();
      triggerGoogleLogin();
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupGoogleAuthTriggers);
} else {
  setupGoogleAuthTriggers();
}

// Global Nav Login / Portal Status Checker
(async function updateHeaderPortalNav() {
  const portalNavLinks = document.querySelectorAll("[data-nav-portal]");
  if (!portalNavLinks.length) return;
  const isEn = document.documentElement.lang === "en";
  const sessionToken = localStorage.getItem("univgov_session");
  if (!sessionToken) return;

  try {
    const res = await fetch("/api/auth?action=me", {
      headers: { "Authorization": `Bearer ${sessionToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && data.citizen) {
        const userName = data.citizen.name || "Citizen";
        portalNavLinks.forEach(link => {
          link.innerHTML = `🏛️ ${isEn ? "My Portal" : "マイポータル"} <span style="font-weight: normal; opacity: 0.85;">(${userName})</span>`;
          link.style.borderColor = "rgba(16, 185, 129, 0.4)";
          link.style.color = "#10b981";
          link.style.background = "rgba(16, 185, 129, 0.15)";
        });
      }
    }
  } catch (e) {}
})();

// ============================================================================
// Cosmic Citizen Portal (My Portal) Controller
// ============================================================================
(async function initPortalController() {
  const unauthView = document.getElementById("portal-unauth-view");
  const authView = document.getElementById("portal-auth-view");
  if (!unauthView && !authView) return; // Not on portal page

  const isEn = document.documentElement.lang === "en";
  const urlParams = new URLSearchParams(window.location.search);
  const tokenParam = urlParams.get("token");
  const emailParam = urlParams.get("email");

  // Global Google login handler
  window.handleGoogleLoginResponse = async function(response) {
    if (!response || !response.credential) return;
    try {
      const res = await fetch("/api/auth?action=google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (data.success && data.sessionToken) {
        localStorage.setItem("univgov_session", data.sessionToken);
        renderAuthenticatedUser(data.citizen);
      } else {
        alert(data.error || (isEn ? "Google sign-in failed." : "Googleログインに失敗しました。"));
      }
    } catch (e) {
      alert(isEn ? "Google sign-in error." : "Googleログインエラーが発生しました。");
    }
  };

  // 1. If Token & Email in URL, verify automatically (legacy link support)
  if (tokenParam && emailParam) {
    try {
      const res = await fetch("/api/auth?action=verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenParam, email: emailParam }),
      });
      const data = await res.json();
      if (data.success && data.sessionToken) {
        localStorage.setItem("univgov_session", data.sessionToken);
        window.history.replaceState({}, document.title, window.location.pathname);
        renderAuthenticatedUser(data.citizen);
        return;
      } else {
        showLoginFeedback(data.error || (isEn ? "Verification token expired or invalid." : "認証トークンが無効または期限切れです。"), "error");
      }
    } catch (err) {
      showLoginFeedback(isEn ? "Verification failed." : "認証処理中にエラーが発生しました。", "error");
    }
  }

  // 2. Check Session on Load
  const sessionToken = localStorage.getItem("univgov_session");
  if (sessionToken) {
    try {
      const res = await fetch("/api/auth?action=me", {
        headers: { "Authorization": `Bearer ${sessionToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.citizen) {
          renderAuthenticatedUser(data.citizen);
          return;
        }
      } else if (res.status === 401) {
        localStorage.removeItem("univgov_session");
      }
    } catch (e) {
      console.warn("Auth check failed:", e);
    }
  }

  // Unauthenticated view by default
  renderUnauthenticatedView();

  function showLoginFeedback(html, type) {
    const box = document.getElementById("login-feedback-msg");
    if (!box) return;
    box.hidden = false;
    box.className = `portal-alert ${type}`;
    box.innerHTML = html;
  }

  function renderUnauthenticatedView() {
    if (unauthView) unauthView.hidden = false;
    if (authView) authView.hidden = true;
  }

  function renderAuthenticatedUser(citizen) {
    window.renderPortalAuthenticatedUser = renderAuthenticatedUser;
    if (unauthView) unauthView.hidden = true;
    if (authView) authView.hidden = false;

    // Overview Elements
    const avatarChar = document.getElementById("portal-avatar-char");
    const portalCitizenId = document.getElementById("portal-citizen-id");
    const portalUserName = document.getElementById("portal-user-name");
    const portalUserEmail = document.getElementById("portal-user-email");
    const portalRegDate = document.getElementById("portal-reg-date");
    const portalStatus = document.getElementById("portal-status");

    // Card Elements
    const cardDisplayName = document.getElementById("card-display-name");
    const cardDisplayEmail = document.getElementById("card-display-email");
    const cardDisplayDate = document.getElementById("card-display-date");
    const cardDisplayId = document.getElementById("card-display-id");

    // Edit Inputs
    const editNameInput = document.getElementById("portal-edit-name");
    const editLnInput = document.getElementById("portal-edit-ln");
    const editBtcInput = document.getElementById("portal-edit-btc");
    const editSalaryRateSelect = document.getElementById("portal-edit-salary-rate");

    // Bitcoin Card Badges and rows
    const cardBtcBadge = document.getElementById("card-btc-badge");
    const cardLnRow = document.getElementById("card-ln-row");
    const cardDisplayLn = document.getElementById("card-display-ln");
    const cardQrImg = document.getElementById("card-qr-img");

    const name = citizen.name || "Citizen";
    const email = citizen.email || citizen.id || "";
    const id = email;
    const lnAddress = citizen.lnAddress || "";
    const btcAddress = citizen.btcAddress || "";
    const btcSalaryRate = citizen.btcSalaryRate || 0;
    let currentUniBalance = typeof citizen.uniBalance === "number" ? citizen.uniBalance : 1000000;

    const d = citizen.createdAt ? new Date(citizen.createdAt) : new Date();
    const formattedDate = new Intl.DateTimeFormat("ja-JP", {
      year: "numeric", month: "2-digit", day: "2-digit"
    }).format(d).replaceAll("/", ".");

    if (avatarChar) avatarChar.textContent = name.slice(0, 1).toUpperCase();
    if (portalCitizenId) portalCitizenId.textContent = id;
    if (portalUserName) portalUserName.textContent = name;
    if (portalUserEmail) portalUserEmail.textContent = email;
    if (portalRegDate) portalRegDate.textContent = formattedDate;
    if (portalStatus) portalStatus.textContent = citizen.status === "active" ? (isEn ? "Active" : "有効（認証済）") : citizen.status;

    if (cardDisplayName) cardDisplayName.textContent = name;
    if (cardDisplayDate) cardDisplayDate.textContent = formattedDate;
    if (cardDisplayId) cardDisplayId.textContent = id;

    // -------------------------------------------------------------
    // Cosmic Currency UNI Vault UI & Ledger
    // -------------------------------------------------------------
    function updateUniDisplays(balance) {
      currentUniBalance = balance;
      const formattedUni = balance.toLocaleString() + " UNI";
      const headerUni = document.getElementById("portal-header-uni");
      const cardUni = document.getElementById("card-display-uni");
      const vaultUni = document.getElementById("vault-uni-balance");

      if (headerUni) headerUni.textContent = formattedUni;
      if (cardUni) cardUni.textContent = formattedUni;
      if (vaultUni) vaultUni.textContent = balance.toLocaleString();
    }
    updateUniDisplays(currentUniBalance);

    // Receive Box ID & QR
    const receiveIdInput = document.getElementById("uni-receive-id-val");
    const receiveQrImg = document.getElementById("uni-receive-qr");
    if (receiveIdInput) receiveIdInput.value = id;
    if (receiveQrImg) {
      const receiveUri = `uni:${encodeURIComponent(id)}`;
      receiveQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(receiveUri)}`;
    }

    const copyUniIdBtn = document.getElementById("btn-copy-uni-id");
    copyUniIdBtn?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(id);
        copyUniIdBtn.textContent = isEn ? "✓ Copied!" : "✓ 完了!";
        setTimeout(() => {
          copyUniIdBtn.textContent = isEn ? "📋 Copy" : "📋 コピー";
        }, 2000);
      } catch (e) {
        alert(id);
      }
    });

    // Transaction Ledger Fetcher
    async function loadUniTransactions() {
      const container = document.getElementById("uni-tx-list-container");
      if (!container) return;
      const curSession = localStorage.getItem("univgov_session");
      if (!curSession) return;

      try {
        const res = await fetch("/api/auth?action=transactions", {
          headers: { "Authorization": `Bearer ${curSession}` },
        });
        if (!res.ok) throw new Error("Failed to load transactions");
        const data = await res.json();
        const txs = data.transactions || [];

        if (txs.length === 0) {
          container.innerHTML = `<div style="text-align: center; color: #8b9bb4; font-size: 0.82rem; padding: 16px;">${isEn ? "No transactions recorded yet." : "まだ取引履歴はありません。"}</div>`;
          return;
        }

        container.innerHTML = txs.map(tx => {
          const isGrant = tx.sender_id === "SYSTEM_GENESIS_GRANT";
          const isOutgoing = tx.sender_id.toLowerCase() === id.toLowerCase();
          const sign = isOutgoing ? "-" : "+";
          const amountColor = isGrant ? "#38bdf8" : (isOutgoing ? "#f59e0b" : "#10b981");
          const badgeIcon = isGrant ? "🪐 GENESIS GRANT" : (isOutgoing ? "↗ SENT" : "↙ RECEIVED");
          const counterparty = isGrant ? "Cosmic Treasury (宇宙政府)" : (isOutgoing ? `To: ${tx.receiver_id}` : `From: ${tx.sender_id}`);
          const dateStr = tx.created_at ? new Date(tx.created_at).toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-";

          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.85rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                  <span style="font-size: 0.68rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.06); color: ${amountColor};">${badgeIcon}</span>
                  <span style="font-family: monospace; font-size: 0.8rem; color: #cbd5e1;">${counterparty}</span>
                </div>
                <div style="font-size: 0.75rem; color: #64748b;">${tx.memo || "UNI Transfer"} ・ ${dateStr}</div>
              </div>
              <div style="text-align: right;">
                <strong style="color: ${amountColor}; font-family: monospace; font-size: 0.95rem;">${sign}${tx.amount.toLocaleString()} UNI</strong>
              </div>
            </div>
          `;
        }).join("");
      } catch (err) {
        container.innerHTML = `<div style="text-align: center; color: #ef4444; font-size: 0.82rem; padding: 12px;">${isEn ? "Failed to load transactions." : "台帳の取得に失敗しました。"}</div>`;
      }
    }

    loadUniTransactions();
    document.getElementById("btn-refresh-txs")?.addEventListener("click", loadUniTransactions);

    // Transfer Form Submission
    const transferForm = document.getElementById("uni-transfer-form");
    transferForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const sendToInput = document.getElementById("uni-send-to");
      const sendAmountInput = document.getElementById("uni-send-amount");
      const sendMemoInput = document.getElementById("uni-send-memo");
      const sendBtn = document.getElementById("btn-send-uni");
      const feedbackBox = document.getElementById("transfer-feedback-msg");

      const to = (sendToInput?.value || "").trim();
      const amount = parseInt(sendAmountInput?.value, 10);
      const memo = (sendMemoInput?.value || "").trim();

      if (!to || isNaN(amount) || amount <= 0) return;
      if (amount > currentUniBalance) {
        if (feedbackBox) {
          feedbackBox.hidden = false;
          feedbackBox.className = "portal-alert error";
          feedbackBox.textContent = isEn ? "Insufficient UNI balance." : "残高が不足しています。";
        }
        return;
      }

      if (sendBtn) sendBtn.disabled = true;
      if (feedbackBox) feedbackBox.hidden = true;

      try {
        const curSession = localStorage.getItem("univgov_session");
        const res = await fetch("/api/auth?action=transfer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${curSession}`,
          },
          body: JSON.stringify({ to, amount, memo }),
        });
        const resData = await res.json();
        if (res.ok && resData.success) {
          if (feedbackBox) {
            feedbackBox.hidden = false;
            feedbackBox.className = "portal-alert success";
            feedbackBox.textContent = resData.message || (isEn ? "Transfer successful!" : "送金が完了しました！");
          }
          if (typeof resData.newBalance === "number") {
            updateUniDisplays(resData.newBalance);
          } else {
            updateUniDisplays(currentUniBalance - amount);
          }
          if (sendAmountInput) sendAmountInput.value = "";
          if (sendMemoInput) sendMemoInput.value = "";
          loadUniTransactions();
        } else {
          throw new Error(resData.error || (isEn ? "Transfer failed." : "送金に失敗しました。"));
        }
      } catch (err) {
        if (feedbackBox) {
          feedbackBox.hidden = false;
          feedbackBox.className = "portal-alert error";
          feedbackBox.textContent = err.message;
        }
      } finally {
        if (sendBtn) sendBtn.disabled = false;
      }
    });

    // Render Bitcoin / Lightning status on card
    if (lnAddress || btcAddress) {
      if (cardBtcBadge) {
        cardBtcBadge.hidden = false;
        cardBtcBadge.textContent = btcSalaryRate >= 50 ? "⚡ BTC SALARY" : "⚡ SATS EARNER";
      }
      if (cardLnRow && cardDisplayLn) {
        cardLnRow.hidden = false;
        cardDisplayLn.textContent = lnAddress || btcAddress;
      }
      if (cardQrImg) {
        const payTarget = lnAddress ? `lightning:${lnAddress}` : `bitcoin:${btcAddress}`;
        cardQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(payTarget)}`;
      }
    }

    if (editNameInput) editNameInput.value = name;
    if (editLnInput) editLnInput.value = lnAddress;
    if (editBtcInput) editBtcInput.value = btcAddress;
    if (editSalaryRateSelect) editSalaryRateSelect.value = String(btcSalaryRate);

    // Dynamic X Post Intent URL with Citizen Name/Email
    const xPostBtn = document.getElementById("btn-portal-x-post");
    if (xPostBtn) {
      const postText = isEn
        ? `[UNIVGOV Parliament Deliberation]\nCitizen: ${name} (${id})\n\n#UNIVGOV #UNIVGOV_BILL\nhttps://univgov.pages.dev`
        : `【宇宙政府 議会発言】\n発言者: ${name} (${id})\n\n#UNIVGOV #UNIVGOV_BILL #宇宙政府\nhttps://univgov.pages.dev`;
      xPostBtn.href = `https://x.com/intent/post?text=${encodeURIComponent(postText)}`;
    }

    // Profile & Bitcoin Settings Update Handler
    const updateForm = document.getElementById("portal-update-form");
    updateForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newName = editNameInput.value.trim();
      const newLn = editLnInput.value.trim();
      const newBtc = editBtcInput.value.trim();
      const newRate = parseInt(editSalaryRateSelect.value, 10) || 0;

      if (!newName) return;
      const updateBtn = document.getElementById("btn-update-name");
      const feedbackBox = document.getElementById("update-feedback-msg");
      if (updateBtn) updateBtn.disabled = true;

      try {
        const curSession = localStorage.getItem("univgov_session");
        const res = await fetch("/api/auth?action=update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${curSession}`,
          },
          body: JSON.stringify({
            name: newName,
            lnAddress: newLn,
            btcAddress: newBtc,
            btcSalaryRate: newRate,
          }),
        });
        const resData = await res.json();
        if (resData.success) {
          if (feedbackBox) {
            feedbackBox.hidden = false;
            feedbackBox.className = "portal-alert success";
            feedbackBox.textContent = isEn ? "Settings updated successfully." : "設定およびBitcoin受取先を保存しました。";
          }
          if (portalUserName) portalUserName.textContent = newName;
          if (cardDisplayName) cardDisplayName.textContent = newName;
          if (avatarChar) avatarChar.textContent = newName.slice(0, 1).toUpperCase();

          if (newLn || newBtc) {
            if (cardBtcBadge) {
              cardBtcBadge.hidden = false;
              cardBtcBadge.textContent = newRate >= 50 ? "⚡ BTC SALARY" : "⚡ SATS EARNER";
            }
            if (cardLnRow && cardDisplayLn) {
              cardLnRow.hidden = false;
              cardDisplayLn.textContent = newLn || newBtc;
            }
            if (cardQrImg) {
              const target = newLn ? `lightning:${newLn}` : `bitcoin:${newBtc}`;
              cardQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(target)}`;
            }
          }
        } else {
          throw new Error(resData.error);
        }
      } catch (err) {
        if (feedbackBox) {
          feedbackBox.hidden = false;
          feedbackBox.className = "portal-alert error";
          feedbackBox.textContent = err.message;
        }
      } finally {
        if (updateBtn) updateBtn.disabled = false;
      }
    });

    // Logout Handler
    document.getElementById("btn-logout")?.addEventListener("click", async () => {
      const curSession = localStorage.getItem("univgov_session");
      if (curSession) {
        try {
          await fetch("/api/auth?action=logout", {
            method: "POST",
            headers: { "Authorization": `Bearer ${curSession}` },
          });
        } catch (e) {}
      }
      localStorage.removeItem("univgov_session");
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.disableAutoSelect();
        } catch (e) {}
      }
      window.location.reload();
    });

    // Print Handlers (ID Card, Salary Form, Store POP)
    document.getElementById("btn-print-card")?.addEventListener("click", () => {
      document.body.dataset.printMode = "card";
      window.print();
    });

    document.getElementById("btn-print-salary-form")?.addEventListener("click", () => {
      document.getElementById("sheet-salary-name").textContent = citizen.name || "---";
      document.getElementById("sheet-salary-id").textContent = citizen.id || "UNIV-2026-00000";
      document.getElementById("sheet-salary-rate").textContent = `${citizen.btcSalaryRate || 10}%`;
      document.getElementById("sheet-salary-ln").textContent = citizen.lnAddress || "未設定 (ウォレット作成後に追記)";
      document.getElementById("sheet-salary-btc").textContent = citizen.btcAddress || "未設定";
      document.getElementById("sheet-salary-date").textContent = formattedDate;

      document.body.dataset.printMode = "salary";
      window.print();
    });

    document.getElementById("btn-print-store-pop")?.addEventListener("click", () => {
      const ln = citizen.lnAddress || citizen.btcAddress || "LNURL / Bitcoin Address";
      document.getElementById("pop-ln-display").textContent = ln;
      const popQr = document.getElementById("pop-qr-img");
      if (popQr) {
        const target = citizen.lnAddress ? `lightning:${citizen.lnAddress}` : (citizen.btcAddress ? `bitcoin:${citizen.btcAddress}` : "https://univgov.pages.dev");
        popQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(target)}`;
      }

      document.body.dataset.printMode = "pop";
      window.print();
    });

    // Data Export Handler
    document.getElementById("btn-export-data")?.addEventListener("click", () => {
      const exportData = {
        univgov_citizen: {
          id: citizen.id,
          name: citizen.name,
          email: citizen.email,
          status: citizen.status || "active",
          emailVerified: citizen.emailVerified,
          createdAt: citizen.createdAt,
          exportedAt: new Date().toISOString(),
          declarationAgreed: true,
          spaceLawApplicable: true,
        }
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `univgov-citizen-${citizen.id || "export"}.json`;
      a.click();
    });

    // Exit Protocol (Account Delete) Handler
    document.getElementById("btn-delete-account")?.addEventListener("click", async () => {
      const confirmText = isEn
        ? "Are you sure you want to execute the Exit Protocol? All your citizen records and sessions will be deleted."
        : "【退出プロトコル】本当にアカウントを削除して脱退しますか？登録データはすべて抹消されます。";
      if (!confirm(confirmText)) return;

      const curSession = localStorage.getItem("univgov_session");
      if (curSession) {
        try {
          await fetch("/api/auth?action=logout", {
            method: "POST",
            headers: { "Authorization": `Bearer ${curSession}` },
          });
        } catch (e) {}
      }
      localStorage.removeItem("univgov_session");
      alert(isEn ? "Exit Protocol completed. You have successfully exited." : "退出プロトコルが完了しました。宇宙政府からの脱退が成立しました。");
      window.location.href = isEn ? "/en/" : "/";
    });
  }
})();

// ============================================================================
// Privacy-Preserving GA-Style First-Party Analytics Tracker
// ============================================================================
(function() {
  // Do not track on admin page itself
  if (location.pathname.startsWith("/admin")) return;

  try {
    // 1. Session ID (Persists per browser tab/window session)
    let sessionId = sessionStorage.getItem("univgov_sid");
    if (!sessionId) {
      sessionId = "s_" + Math.random().toString(36).slice(2, 11) + "_" + Date.now().toString(36);
      sessionStorage.setItem("univgov_sid", sessionId);
    }

    // 2. Extract UTM & Referrer
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get("utm_source") || "";

    // 3. Detect Device Type
    const width = window.innerWidth;
    const device = width <= 640 ? "mobile" : (width <= 1024 ? "tablet" : "desktop");

    let pageviewId = null;
    const startTime = Date.now();

    // 4. Send Initial Pageview
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        path: location.pathname,
        referrer: document.referrer || "",
        utm_source: utmSource,
        device: device,
      }),
    }).then(res => res.json()).then(data => {
      if (data && data.pageviewId) {
        pageviewId = data.pageviewId;
      }
      if (data && typeof data.totalCount === "number" && data.totalCount > 0) {
        window.dispatchEvent(new CustomEvent("univgov_pageview_tracked", { detail: { totalCount: data.totalCount } }));
      }
    }).catch(() => {});

    // 5. Send Duration Ping
    function sendDurationPing() {
      if (!pageviewId) return;
      const duration = Math.round((Date.now() - startTime) / 1000);
      if (duration <= 0) return;

      const payload = JSON.stringify({
        pageview_id: pageviewId,
        duration_seconds: duration,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track/ping", payload);
      } else {
        fetch("/api/track/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    }

    // Periodic ping every 15s
    const pingInterval = setInterval(sendDurationPing, 15000);

    // Ping on tab switch / exit
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        sendDurationPing();
      }
    });
    window.addEventListener("pagehide", () => {
      clearInterval(pingInterval);
      sendDurationPing();
    });
  } catch (e) {}
})();

// ============================================================================
// Retro-Futuristic Access Counter
// ============================================================================
(function initAccessCounter() {
  const counterBox = document.querySelector("[data-access-counter]");
  const counterWrap = document.querySelector(".access-counter-wrap");
  if (!counterBox) return;

  const STORAGE_KEY = "univgov_visit_count";
  const CACHED_TOTAL_KEY = "univgov_cached_total_pvs";

  let personalVisits = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10) + 1;
  try {
    localStorage.setItem(STORAGE_KEY, personalVisits.toString());
  } catch (_) {}

  const cachedTotal = parseInt(localStorage.getItem(CACHED_TOTAL_KEY) || "0", 10);
  let currentCount = cachedTotal > 0 ? cachedTotal : personalVisits;

  function renderDigits(count) {
    const formatted = Math.max(1, count).toString().padStart(8, "0");
    counterBox.innerHTML = formatted
      .split("")
      .map((d) => `<span class="counter-digit">${d}</span>`)
      .join("");
    return formatted;
  }

  let formattedCount = renderDigits(currentCount);

  function applyRealCount(total) {
    if (typeof total === "number" && total > 0) {
      currentCount = total;
      try {
        localStorage.setItem(CACHED_TOTAL_KEY, total.toString());
      } catch (_) {}
      formattedCount = renderDigits(currentCount);
    }
  }

  window.addEventListener("univgov_pageview_tracked", (e) => {
    if (e.detail && e.detail.totalCount) {
      applyRealCount(e.detail.totalCount);
    }
  });

  if (counterWrap) {
    counterWrap.addEventListener("click", () => {
      const isEn = document.documentElement.lang === "en";
      const message = isEn
        ? `🎉 You are Cosmic Visitor #${formattedCount}!\n(Under Cosmic Law Art. 42, guestbook posting & kiriban reporting obligations are fully waived.)`
        : `🎉 おめでとうございます！ あなたは第 ${formattedCount} 人目の宇宙脱出者です！\n（※宇宙法第42条により、キリ番報告・BBS記念カキコ義務は完全に免除されています）`;
      alert(message);
    });
  }
})();

// AI Toolkit Prompt Copy & Context Copy Handler
(function initAiToolkit() {
  document.addEventListener("click", async (e) => {
    const promptBtn = e.target.closest(".btn-copy-prompt");
    if (promptBtn) {
      const text = promptBtn.getAttribute("data-prompt-text");
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        const span = promptBtn.querySelector("span");
        const origText = span ? span.textContent : "";
        if (span) span.textContent = document.documentElement.lang === "en" ? "Copied!" : "コピー完了！";
        promptBtn.style.background = "#10b981";
        setTimeout(() => {
          if (span) span.textContent = origText;
          promptBtn.style.background = "";
        }, 2000);
      } catch (err) {
        console.warn("Failed to copy prompt:", err);
      }
      return;
    }

    const contextBtn = e.target.closest("#btn-copy-context-url");
    if (contextBtn) {
      const url = contextBtn.getAttribute("data-context-url") || (window.location.origin + "/univgov_all.md");
      try {
        await navigator.clipboard.writeText(url);
        const span = contextBtn.querySelector("span");
        const origText = span ? span.textContent : "";
        if (span) span.textContent = document.documentElement.lang === "en" ? "URL Copied!" : "URLコピー完了！";
        contextBtn.style.background = "#10b981";
        setTimeout(() => {
          if (span) span.textContent = origText;
          contextBtn.style.background = "";
        }, 2000);
      } catch (err) {
        console.warn("Failed to copy context url:", err);
      }
      return;
    }
  });
})();

// Auto-expand #deep-dive when navigating to internal sections inside it
(function setupDeepDiveAutoOpen() {
  const deepDiveIds = new Set([
    "rules", "laws", "articles", "parliament", "btc-zone", "ai-toolkit", "deep-dive"
  ]);

  function checkAndOpenHash(hash) {
    if (!hash) return;
    const cleanId = hash.replace(/^#/, "");
    if (deepDiveIds.has(cleanId)) {
      const details = document.getElementById("deep-dive");
      if (details) {
        details.open = true;
        const target = document.getElementById(cleanId);
        if (target) {
          setTimeout(() => {
            target.scrollIntoView({ behavior: "smooth" });
          }, 50);
        }
      }
    }
  }

  if (window.location.hash) {
    checkAndOpenHash(window.location.hash);
  }

  window.addEventListener("hashchange", () => {
    checkAndOpenHash(window.location.hash);
  });

  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href*="#"]');
    if (!link) return;
    try {
      const url = new URL(link.href, window.location.href);
      if (url.pathname === window.location.pathname && url.hash) {
        checkAndOpenHash(url.hash);
      }
    } catch (_) {}
  });
})();
