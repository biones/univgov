export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "DB binding not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const todayStart = `${todayStr}T00:00:00.000Z`;
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Today & Total Stats
    const todayStats = await env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT session_id) as visitors,
        COUNT(*) as pageviews,
        AVG(CASE WHEN duration_seconds > 0 THEN duration_seconds ELSE NULL END) as avg_duration
      FROM pageviews
      WHERE created_at >= ?
    `).bind(todayStart).first();

    const totalStats = await env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT session_id) as visitors,
        COUNT(*) as pageviews,
        AVG(CASE WHEN duration_seconds > 0 THEN duration_seconds ELSE NULL END) as avg_duration
      FROM pageviews
    `).first();

    // 2. Active Now (last 5 min)
    const activeNow = await env.DB.prepare(`
      SELECT COUNT(DISTINCT session_id) as count
      FROM pageviews
      WHERE updated_at >= ?
    `).bind(fiveMinAgo).first();

    // 3. Top Pages (All-time or last 7 days)
    const { results: topPages } = await env.DB.prepare(`
      SELECT 
        path,
        COUNT(*) as pageviews,
        COUNT(DISTINCT session_id) as visitors,
        ROUND(AVG(CASE WHEN duration_seconds > 0 THEN duration_seconds ELSE NULL END)) as avg_duration
      FROM pageviews
      WHERE created_at >= ?
      GROUP BY path
      ORDER BY pageviews DESC
      LIMIT 10
    `).bind(sevenDaysAgo).all();

    // 4. Referrer Sources
    const { results: topReferrers } = await env.DB.prepare(`
      SELECT 
        referrer_source,
        COUNT(*) as count,
        COUNT(DISTINCT session_id) as visitors
      FROM pageviews
      WHERE created_at >= ? AND referrer_source != 'サイト内回遊'
      GROUP BY referrer_source
      ORDER BY count DESC
      LIMIT 8
    `).bind(sevenDaysAgo).all();

    // 5. Daily History (Last 7 Days)
    const { results: dailyHistory } = await env.DB.prepare(`
      SELECT 
        SUBSTR(created_at, 1, 10) as date,
        COUNT(DISTINCT session_id) as visitors,
        COUNT(*) as pageviews
      FROM pageviews
      WHERE created_at >= ?
      GROUP BY SUBSTR(created_at, 1, 10)
      ORDER BY date ASC
    `).bind(sevenDaysAgo).all();

    // 6. Citizen Registration Stats
    const totalCitizens = await env.DB.prepare("SELECT COUNT(*) as count FROM citizens").first();
    const todayCitizens = await env.DB.prepare("SELECT COUNT(*) as count FROM citizens WHERE created_at >= ?").bind(todayStart).first();
    const { results: recentCitizens } = await env.DB.prepare(
      "SELECT id, citizen_id, name, created_at, ip FROM citizens ORDER BY id DESC LIMIT 20"
    ).all();

    // 7. Recent Pageviews Stream
    const { results: recentPageviews } = await env.DB.prepare(`
      SELECT id, path, referrer_source, duration_seconds, created_at, device, ip
      FROM pageviews
      ORDER BY id DESC
      LIMIT 15
    `).all();

    const visitorsCount = totalStats?.visitors || 0;
    const citizensCount = totalCitizens?.count || 0;
    const cvr = visitorsCount > 0 ? ((citizensCount / visitorsCount) * 100).toFixed(1) : "0.0";

    return new Response(
      JSON.stringify({
        summary: {
          todayVisitors: todayStats?.visitors || 0,
          todayPageviews: todayStats?.pageviews || 0,
          todayAvgDuration: Math.round(todayStats?.avg_duration || 0),
          totalVisitors: totalStats?.visitors || 0,
          totalPageviews: totalStats?.pageviews || 0,
          totalAvgDuration: Math.round(totalStats?.avg_duration || 0),
          activeNow: activeNow?.count || 0,
          totalCitizens: citizensCount,
          todayCitizens: todayCitizens?.count || 0,
          cvr: `${cvr}%`,
        },
        topPages: topPages || [],
        topReferrers: topReferrers || [],
        dailyHistory: dailyHistory || [],
        recentCitizens: recentCitizens || [],
        recentPageviews: recentPageviews || [],
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
