function parseReferrerSource(referrer = "", utmSource = "") {
  const utm = (utmSource || "").toLowerCase();
  if (utm.includes("twitter") || utm === "x" || utm.includes("t.co")) return "X (Twitter)";
  if (utm.includes("5ch") || utm.includes("2ch") || utm.includes("open2ch") || utm.includes("board")) return "5ちゃんねる";
  if (utm.includes("line")) return "LINE";
  if (utm.includes("bsky") || utm.includes("bluesky")) return "Bluesky";
  if (utm.includes("real_nomi") || utm.includes("nomi")) return "リアル飲み会 / オフ会";
  if (utm.includes("qr")) return "QRコード";

  if (!referrer) return "直接 / ブックマーク";

  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes("t.co") || host.includes("twitter.com") || host.includes("x.com")) return "X (Twitter)";
    if (host.includes("5ch.net") || host.includes("2ch.sc") || host.includes("open2ch.net") || host.includes("shitaraba")) return "5ちゃんねる";
    if (host.includes("line.me") || host.includes("naver.jp")) return "LINE";
    if (host.includes("bsky.app") || host.includes("bluesky")) return "Bluesky";
    if (host.includes("google.")) return "Google検索";
    if (host.includes("yahoo.")) return "Yahoo!検索";
    if (host.includes("bing.")) return "Bing検索";
    if (host.includes("duckduckgo.")) return "DuckDuckGo";
    if (host.includes("hatena.ne.jp")) return "はてなブックマーク";
    if (host.includes("github.com")) return "GitHub";
    if (host.includes("univgov.pages.dev")) return "サイト内回遊";
    return host;
  } catch {
    return "その他";
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const sessionId = (body.session_id || "").trim().slice(0, 64) || "anon";
    const path = (body.path || "/").trim().slice(0, 200);
    const referrer = (body.referrer || "").trim().slice(0, 500);
    const utmSource = (body.utm_source || "").trim().slice(0, 100);
    const device = (body.device || "desktop").trim().slice(0, 20);
    const referrerSource = parseReferrerSource(referrer, utmSource);

    const now = new Date().toISOString();
    const ip = request.headers.get("CF-Connecting-IP") || "";
    const userAgent = request.headers.get("User-Agent") || "";

    // Ignore site internal pageviews as referrers for clean attribution
    let finalSource = referrerSource;
    if (finalSource === "サイト内回遊") {
      finalSource = utmSource ? parseReferrerSource("", utmSource) : "サイト内回遊";
    }

    let pageviewId = 0;
    let totalCount = 0;
    if (env.DB) {
      const result = await env.DB.prepare(
        "INSERT INTO pageviews (session_id, path, referrer, referrer_source, duration_seconds, created_at, updated_at, ip, user_agent, device) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?)"
      ).bind(sessionId, path, referrer, finalSource, now, now, ip, userAgent, device).run();
      pageviewId = result.meta?.last_row_id || 0;
      totalCount = pageviewId;
    }

    return new Response(
      JSON.stringify({
        success: true,
        pageviewId,
        totalCount,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
