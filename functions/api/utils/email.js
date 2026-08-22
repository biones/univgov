/**
 * Universal Email Sender for Univgov Cloudflare Functions
 * Supports Resend API with local development fallback
 */

export async function sendVerificationEmail({ to, name, citizenId, token, baseUrl, env }) {
  const verifyUrl = `${baseUrl}/portal?token=${token}&email=${encodeURIComponent(to)}`;
  const subject = `【宇宙政府】宇宙国民アカウントの認証のご案内 (${citizenId})`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; letter-spacing: 0.05em; }
    .content { padding: 32px 24px; line-height: 1.6; color: #cbd5e1; }
    .card { background: #0b0f19; border: 1px solid #334155; border-radius: 8px; padding: 18px; margin: 20px 0; }
    .card-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .card-row:last-child { margin-bottom: 0; }
    .label { color: #94a3b8; }
    .val { color: #38bdf8; font-weight: 600; }
    .btn-wrap { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: #0284c7; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px rgba(2,132,199,0.4); }
    .footer { padding: 20px 24px; background: #0b0f19; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; text-align: center; }
    .link-alt { word-break: break-all; color: #38bdf8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>UNIVGOV CITIZEN PORTAL</h1>
      <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">宇宙国民アカウント 認証通知</p>
    </div>
    <div class="content">
      <p><strong>${name}</strong> 様</p>
      <p>宇宙政府（UNIVGOV）へのアカウント登録申請を受け付けました。<br>以下の「宇宙国民マイポータルへアクセス」ボタンをクリックして、メールアドレスの認証を完了してください。</p>
      
      <div class="card">
        <div class="card-row">
          <span class="label">識別名 (NAME)</span>
          <span class="val">${name}</span>
        </div>
        <div class="card-row">
          <span class="label">宇宙国民ID (CITIZEN ID)</span>
          <span class="val">${citizenId}</span>
        </div>
        <div class="card-row">
          <span class="label">登録メールアドレス</span>
          <span class="val">${to}</span>
        </div>
      </div>

      <div class="btn-wrap">
        <a href="${verifyUrl}" class="btn">宇宙国民マイポータルへアクセス →</a>
      </div>

      <p style="font-size: 13px; color: #94a3b8;">
        ※ボタンが押せない場合は、下記URLをブラウザのアドレスバーに直接貼り付けてアクセスしてください：<br>
        <a href="${verifyUrl}" class="link-alt">${verifyUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">本メールにお心当たりがない場合は、破棄してください。</p>
      <p style="margin: 4px 0 0 0;">&copy; UNIVGOV — Non-territorial Modular Governance Project</p>
    </div>
  </div>
</body>
</html>
`;

  const apiKey = env?.RESEND_API_KEY;
  const fromEmail = env?.SENDER_EMAIL || "UNIVGOV <onboarding@resend.dev>";

  if (apiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject: subject,
          html: html,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Resend API Error:", errorText);
        return { success: false, error: errorText, fallbackUrl: verifyUrl };
      }

      const resData = await response.json();
      return { success: true, id: resData.id, verifyUrl };
    } catch (err) {
      console.error("Failed to call Resend API:", err);
      return { success: false, error: err.message, fallbackUrl: verifyUrl };
    }
  } else {
    // Development / Local Fallback Mode
    console.log(`[EMAIL_DEV_MODE] Email verification to ${to}`);
    console.log(`[EMAIL_DEV_MODE] Verify URL: ${verifyUrl}`);
    return { success: true, devMode: true, verifyUrl };
  }
}
