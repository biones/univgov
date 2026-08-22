#!/usr/bin/env node

/**
 * 宇宙政府 UNIVGOV - 流入追跡（UTMパラメータ）リンク生成ツール
 * 
 * 使い方:
 *   node scripts/generate_utm_links.mjs
 *   または
 *   npm run utm
 */

const BASE_URL = "https://univgov.pages.dev";

const campaigns = [
  {
    name: "X (Twitter) バズツイートぶら下げリプライ",
    baseUrl: `${BASE_URL}/`,
    params: { utm_source: "x", utm_medium: "reply", utm_campaign: "buzz_thread" },
    note: "Xで話題のツイートへのリプライでサイトトップへ誘導する際にご利用ください。"
  },
  {
    name: "X (Twitter) 『宇宙政府への反論に答える』直接リンク",
    baseUrl: `${BASE_URL}/articles/questions-and-objections`,
    params: { utm_source: "x", utm_medium: "reply", utm_campaign: "qa_article" },
    note: "議論や反論スレッドへのぶら下げに最適です。"
  },
  {
    name: "Discord 飲酒サーバー・一般チャット",
    baseUrl: `${BASE_URL}/`,
    params: { utm_source: "discord", utm_medium: "drink_server", utm_campaign: "chat_share" },
    note: "Discord鯖の雑談・飲酒チャンネルで雑談中におすすめするとき用。"
  },
  {
    name: "LINE オープンチャット",
    baseUrl: `${BASE_URL}/`,
    params: { utm_source: "line_oc", utm_medium: "chat", utm_campaign: "oc_share" },
    note: "LINEオプチャ内でリンク共有するとき用。"
  },
  {
    name: "リアル飲み会・オフ会用 特設ページ (/nomi)",
    baseUrl: `${BASE_URL}/nomi`,
    params: { utm_source: "real_nomi", utm_medium: "qr", utm_campaign: "offline_party" },
    note: "飲み会で相手にスマホ画面を見せるか、QRコードを読んでもらう専用ページ。"
  }
];

function buildUrl(baseUrl, params) {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

console.log("\n=======================================================");
console.log("  🚀 宇宙政府 (UNIVGOV) 宣伝用 UTM トラッキングリンク一覧");
console.log("=======================================================\n");

campaigns.forEach((c, idx) => {
  const fullUrl = buildUrl(c.baseUrl, c.params);
  console.log(`[${idx + 1}] ${c.name}`);
  console.log(`    🔗 URL: ${fullUrl}`);
  console.log(`    💡 用途: ${c.note}\n`);
});

console.log("-------------------------------------------------------");
console.log("※ Cloudflare Analytics 等で各パラメータのアクセス数を個別に計測できます。");
console.log("-------------------------------------------------------\n");
