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
      return new Response(JSON.stringify({ citizens: [], total: 0, warning: "DB binding not found" }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const { results } = await env.DB.prepare(
      "SELECT id, citizen_id, name, created_at, ip, user_agent FROM citizens ORDER BY id DESC LIMIT 100"
    ).all();

    const countResult = await env.DB.prepare("SELECT COUNT(*) as count FROM citizens").first();

    return new Response(
      JSON.stringify({
        total: countResult ? countResult.count : (results ? results.length : 0),
        citizens: results || [],
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
