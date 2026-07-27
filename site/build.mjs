import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { articles, site } from "./site.config.mjs";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, "dist");

const escapeHtml = (value = "") => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const inline = (value) => {
  let html = escapeHtml(value);
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" rel="noreferrer">$1</a>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  return html;
};

function renderMarkdown(markdown) {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const titleLine = lines.find((line) => line.startsWith("# ")) ?? "# Untitled";
  const title = titleLine.slice(2).trim();
  const body = [];
  const toc = [];
  let paragraph = [];
  let listType = null;
  let quote = [];
  let table = [];
  let headingIndex = 0;

  const flushParagraph = () => {
    if (paragraph.length) body.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (listType) body.push(`</${listType}>`);
    listType = null;
  };
  const flushQuote = () => {
    if (quote.length) body.push(`<blockquote>${quote.map((line) => `<p>${inline(line)}</p>`).join("")}</blockquote>`);
    quote = [];
  };
  const flushTable = () => {
    if (table.length < 2) {
      table.forEach((row) => body.push(`<p>${inline(row)}</p>`));
      table = [];
      return;
    }
    const rows = table.map((row) => row.split("|").slice(1, -1).map((cell) => cell.trim()));
    const isDivider = rows[1].every((cell) => /^:?-{3,}:?$/.test(cell));
    if (!isDivider) {
      table.forEach((row) => body.push(`<p>${inline(row)}</p>`));
    } else {
      const head = `<thead><tr>${rows[0].map((cell) => `<th>${inline(cell)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${rows.slice(2).map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join("")}</tr>`).join("")}</tbody>`;
      body.push(`<div class="table-wrap"><table>${head}${tbody}</table></div>`);
    }
    table = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
    flushTable();
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line === titleLine) continue;
    if (line.startsWith("|")) {
      flushParagraph(); flushList(); flushQuote();
      table.push(line);
      continue;
    }
    flushTable();
    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      flushParagraph(); flushList(); flushQuote();
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = `section-${++headingIndex}`;
      body.push(`<h${level} id="${id}">${inline(text)}<a class="heading-anchor" href="#${id}" aria-label="この見出しへのリンク">#</a></h${level}>`);
      if (level === 2) toc.push({ id, text });
      continue;
    }
    if (line.startsWith("> ")) {
      flushParagraph(); flushList();
      quote.push(line.slice(2).trim());
      continue;
    }
    flushQuote();
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextType = ordered ? "ol" : "ul";
      if (listType !== nextType) {
        flushList();
        body.push(`<${nextType}>`);
        listType = nextType;
      }
      body.push(`<li>${inline((unordered ?? ordered)[1])}</li>`);
      continue;
    }
    if (!line.trim()) {
      flushAll();
      continue;
    }
    paragraph.push(line.trim());
  }
  flushAll();
  return { title, html: body.join("\n"), toc };
}

const formatDate = (date) => new Intl.DateTimeFormat("ja-JP", {
  year: "numeric", month: "long", day: "numeric",
}).format(new Date(`${date}T00:00:00+09:00`));

const nav = (active = "") => `
  <header class="site-header">
    <a class="brand" href="/" aria-label="${site.name} ホーム">
      <span>UNIVGOV<small>宇宙政府プロジェクト</small></span>
    </a>
    <nav aria-label="メインナビゲーション">
      <a href="/">HOME</a>
      <a ${active === "articles" ? 'aria-current="page"' : ""} href="/#articles">ARTICLES</a>
      <a href="/articles/doctrine-v2">7 RULES</a>
      <a href="/articles/space-law-v1">SPACE LAW</a>
      <a ${active === "campaign" ? 'aria-current="page"' : ""} href="/seikatsuhogo/">くらしの最低線</a>
      <button class="search-trigger" type="button" data-search-open aria-label="記事を検索">SEARCH</button>
    </nav>
  </header>`;

const shell = ({ title, description, content, active = "", bodyClass = "", canonical = "", ogImage = "" }) => `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  ${canonical ? `<link rel="canonical" href="${canonical}">` : ""}
  <meta name="theme-color" content="#090c10">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  ${canonical ? `<meta property="og:url" content="${canonical}">` : ""}
  ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ""}
  <meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${ogImage ? `<meta name="twitter:image" content="${ogImage}">` : ""}
  <link rel="icon" href="/assets/univgov-logo.jpg" type="image/jpeg">
  <link rel="stylesheet" href="/assets/styles.css">
  <script src="/assets/site.js" defer></script>
</head>
<body class="${bodyClass}">
  <a class="skip-link" href="#main">本文へ移動</a>
  <div class="ambient" aria-hidden="true"></div>
  ${nav(active)}
  <main id="main">${content}</main>
  <footer class="site-footer">
    <div><span class="signal" aria-hidden="true"></span>${site.name}</div>
    <p>法的に承認された政府ではありません。暴力・脅迫・差別・違法行為を支持しません。</p>
    <a href="/#top">TOP ↑</a>
  </footer>
  <dialog class="search-dialog" data-search-dialog aria-label="記事検索">
    <form method="dialog"><button aria-label="検索を閉じる">×</button></form>
    <label for="site-search">SEARCH THE ARCHIVE</label>
    <input id="site-search" type="search" placeholder="キーワードを入力" autocomplete="off" data-search-input>
    <div class="search-results" data-search-results></div>
  </dialog>
</body>
</html>`;

const card = (article, rendered) => `
  <article class="article-card accent-${article.accent}" data-article-card data-search-text="${escapeHtml(`${rendered.title} ${article.summary} ${article.label}`.toLowerCase())}">
    <div class="card-meta"><span>${article.label}</span><time datetime="${article.date}">${article.date.replaceAll("-", ".")}</time></div>
    <h3><a href="/articles/${article.slug}">${inline(article.displayTitle ?? rendered.title)}</a></h3>
    <p>${escapeHtml(article.summary)}</p>
    <div class="card-foot"><span>${article.read}</span><a aria-label="${escapeHtml(rendered.title)}を読む" href="/articles/${article.slug}">READ <b>↗</b></a></div>
  </article>`;

const principles = [
  ["01", "BELONGING / 所属先を選べる", "生まれた場所を、心の所属先に固定しない。複数所属も無所属もOK。"],
  ["02", "NO TERRITORY / 土地を支配しない", "土地や武力を、正しさの証明に使わない。"],
  ["03", "MINIMUM FORCE / 強制は最小限", "具体的な危害を止める以上の強制を増やさない。"],
  ["04", "MODULAR DESIGN / 機能を分ける", "通貨、資格、福祉、教育、認証をモジュールとして切り分ける。"],
  ["05", "OPEN METRICS / 効果を公開", "目的、コスト、効果、代替案、失敗条件をオープンにする。"],
  ["06", "EXIT ENABLED / 乗り換え可能", "参加だけでなく、EXITとデータ移行を最初から設計する。"],
  ["07", "ROLLBACK READY / ダメなら戻す", "小さくテストし、期限を決め、失敗したらロールバックする。"],
];

function homepage(renderedArticles) {
  const featured = articles.filter((item) => item.featured).map((item) => card(item, renderedArticles.get(item.slug))).join("");
  const allCards = articles.map((item) => card(item, renderedArticles.get(item.slug))).join("");
  return shell({
    title: `${site.name} — 国家を運命から選べる部品へ`,
    description: site.description,
    bodyClass: "home",
    content: `
      <section class="hero" id="top">
        <div class="hero-banner">
          <img src="/assets/univgov-logo.jpg" alt="宇宙政府のロケットロゴ" width="540" height="540">
          <h1>UNIVGOV<small>MODULAR GOVERNANCE PROTOCOL</small></h1>
          <img src="/assets/univgov-logo.jpg" alt="" width="540" height="540">
        </div>
        <div class="hero-intro">
          <p class="kicker">REBUILD GOVERNMENT AS MODULAR SOFTWARE</p>
          <h2>住む場所はそのまま。<br><span>所属するシステムは選べる。</span></h2>
          <p class="lead">UNIVGOVは、国がひとまとめにしているID、ルール、通貨、資格、行政サービス、コミュニティを、独立したモジュールへ分解する市民プロジェクトです。</p>
          <p class="lead">新しい領土や支配者は作りません。比較できる、テストできる、いつでもEXITできる。そんなガバナンス・プロトコルを実装します。</p>
          <div class="hero-actions">
            <a class="button primary" href="/articles/doctrine-v2">READ 7 RULES</a>
            <a class="button ghost" href="#articles">VIEW ARTICLES</a>
          </div>
        </div>
      </section>

      <aside class="campaign-promo" aria-label="くらしの最低線キャンペーン">
        <div>
          <span>PUBLIC CAMPAIGN / 2026</span>
          <h2>最低生活費を、物価に連動させよう。</h2>
          <p>2013年から2025年までに総合物価は約17.9%上昇。一時加算ではなく、毎年追いつく透明な仕組みを求めます。</p>
        </div>
        <a href="/seikatsuhogo/">根拠と行動を見る <b>↗</b></a>
      </aside>

      <section class="featured-section" aria-labelledby="featured-title">
        <div class="section-head"><div><span>01 / LATEST POSTS</span><h2 id="featured-title">New from UNIVGOV</h2></div><p>アイデアを宣言で終わらせず、動くシステムへ変えるための最新ノート。</p></div>
        <div class="featured-grid">${featured}</div>
      </section>

      <section class="manifesto-band">
        <p>DON'T FIGHT THE STATE. SHIP THE ALTERNATIVE.</p>
        <h2>国家と戦うより、<br><em>もっと使えるシステム</em>を実装する。</h2>
        <a href="/articles/hundred-year-thesis">READ THE 100 YEAR THESIS ↗</a>
      </section>

      <section class="principles" aria-labelledby="principles-title">
        <div class="section-head"><div><span>02 / DESIGN RULES</span><h2 id="principles-title">7 rules for the protocol</h2></div><p>新しい権威を作るのではなく、システムが肥大化しない設計ルールを先に決める。</p></div>
        <ol class="principle-list">${principles.map(([n, title, text]) => `<li><span>${n}</span><h3>${title}</h3><p>${text}</p></li>`).join("")}</ol>
      </section>

      <section class="archive" id="articles" aria-labelledby="archive-title">
        <div class="section-head"><div><span>03 / ARTICLE INDEX</span><h2 id="archive-title">Docs & Notes</h2></div><div class="archive-tools"><label for="archive-search">FILTER</label><input id="archive-search" type="search" placeholder="キーワードで検索" data-card-filter></div></div>
        <div class="article-grid" data-card-grid>${allCards}</div>
        <p class="empty-state" data-empty-state hidden>一致する記事はありません。</p>
      </section>

      <section class="declaration">
        <span>JOIN / EXIT / FORK</span>
        <h2>Permissionless citizenship.</h2>
        <p>参加もEXITも自由。ほかのコミュニティと併用できる、オープンな所属プロトコル。</p>
        <a class="button primary" href="/articles/cosmic-citizen-declaration">READ COSMIC CITIZEN ↗</a>
      </section>`,
  });
}

function articlePage(article, rendered) {
  const toc = rendered.toc.map(({ id, text }) => `<a href="#${id}">${escapeHtml(text)}</a>`).join("");
  return shell({
    title: `${rendered.title} — ${site.name}`,
    description: article.summary,
    active: "articles",
    bodyClass: `article-page accent-${article.accent}`,
    content: `
      <article class="article-shell">
        <header class="article-hero">
          <a class="back-link" href="/#articles">← ALL TRANSMISSIONS</a>
          <div class="article-meta"><span>${article.label}</span><time datetime="${article.date}">${formatDate(article.date)}</time><span>${article.read}</span></div>
          <h1>${inline(article.displayTitle ?? rendered.title)}</h1>
          <p>${escapeHtml(article.summary)}</p>
        </header>
        <div class="article-layout">
          <aside class="article-toc"><span>ON THIS PAGE</span>${toc || '<a href="#article-body">本文</a>'}</aside>
          <div class="prose" id="article-body">${rendered.html}</div>
        </div>
        <footer class="article-end">
          <span>END OF TRANSMISSION</span>
          <h2>制度は、信じるものではなく<br>比較し、検証し、退出できるものへ。</h2>
          <a href="/#articles">ほかの論考を読む →</a>
        </footer>
      </article>`,
  });
}

const campaignSources = {
  cpi: "https://www.stat.go.jp/data/cpi/sokuhou/nen/index-z.html",
  standards: "https://www.mhlw.go.jp/content/12002000/001662704.pdf",
  review: "https://www.mhlw.go.jp/stf/shingi/shingi-hosho_126702.html",
  judgment: "https://www.mhlw.go.jp/stf/newpage_68902.html",
  petition: "https://chng.it/w2Yyn4wB4R",
  opinion: "https://www.mhlw.go.jp/form/pub/mhlw01/getmail",
  contact: "https://www.mhlw.go.jp/otoiawase/index.html",
};

function campaignPage() {
  const cpiIncrease = (((111.9 / 94.9) - 1) * 100).toFixed(1);
  return shell({
    title: "くらしの最低線 — 最低生活費を、物価に連動させよう。",
    description: "生活扶助基準を一時的な加算ではなく、物価と必需品価格に継続して連動させることを求める市民キャンペーン。",
    active: "campaign",
    bodyClass: "campaign-page",
    canonical: "https://univgov.pages.dev/seikatsuhogo/",
    ogImage: "https://univgov.pages.dev/assets/campaign-og.png",
    content: `
      <section class="campaign-hero" id="top">
        <div class="campaign-hero__copy">
          <p class="campaign-eyebrow">くらしの最低線 / PUBLIC CAMPAIGN</p>
          <h1>最低生活費を、<br><em>物価に連動</em>させよう。</h1>
          <p class="campaign-lead">物価は上がる。最低生活費は、一時的な定額加算ではなく、食費や光熱費の変化に継続して追いつく仕組みへ。</p>
          <div class="campaign-actions">
            <a class="campaign-button campaign-button--primary" href="${campaignSources.petition}" target="_blank" rel="noreferrer">署名に参加する <span>↗</span></a>
            <a class="campaign-button campaign-button--paper" href="#action">3分で意見を届ける ↓</a>
          </div>
          <p class="campaign-micro">署名先：Change.org ／ 本ページは市民による自主的な政策提案です</p>
        </div>
        <div class="price-ledger" aria-label="2013年から2025年までの消費者物価指数の変化">
          <div class="price-ledger__stamp">政府統計で確認</div>
          <p>全国・総合CPI<br><span>2020年＝100</span></p>
          <div class="price-ledger__row"><span>2013</span><strong>94.9</strong></div>
          <div class="price-ledger__line" aria-hidden="true"><i></i></div>
          <div class="price-ledger__row"><span>2025</span><strong>111.9</strong></div>
          <div class="price-ledger__result"><span>12年間で</span><strong>+${cpiIncrease}%</strong></div>
          <a href="${campaignSources.cpi}" target="_blank" rel="noreferrer">総務省統計局・2025年平均 ↗</a>
        </div>
      </section>

      <nav class="campaign-jump" aria-label="ページ内メニュー">
        <a href="#facts">数字で見る</a>
        <a href="#requests">3つの要求</a>
        <a href="#action">いま行動する</a>
        <a href="#copy">コピペ素材</a>
        <a href="#sources">出典</a>
      </nav>

      <section class="campaign-status" aria-label="制度の現在地">
        <div>
          <span class="campaign-label">事実を更新しました</span>
          <h2>「全く上がっていない」ではなく、<br>「一時措置だけでは足りない」。</h2>
        </div>
        <div class="campaign-status__items">
          <p><strong>+1,500円／人・月</strong><span>2025～26年度の特例加算</span></p>
          <p><strong>さらに+1,000円</strong><span>2026年10月から1年間の予定</span></p>
          <p><strong>まだ一時措置</strong><span>物価への恒久的な自動連動ではない</span></p>
        </div>
        <p class="campaign-note">生活扶助額は年齢・世帯人数・地域などで異なります。上記は生活扶助基準に対する特例加算の説明です。<a href="${campaignSources.standards}" target="_blank" rel="noreferrer">厚生労働省資料を確認 ↗</a></p>
      </section>

      <section class="campaign-section campaign-facts" id="facts">
        <header class="campaign-section__head">
          <span class="campaign-label">01 / FACTS</span>
          <h2>平均の数字でも、<br>暮らしの余白は削られる。</h2>
          <p>CPIは全国平均です。食費の比率が高い世帯ほど、必需品の値上がりを強く受けます。</p>
        </header>
        <div class="fact-grid">
          <article class="fact-card fact-card--orange">
            <span>総合物価</span>
            <strong>+${cpiIncrease}%</strong>
            <p>2013年平均94.9 → 2025年平均111.9。総務省統計局の全国・総合CPIから算出。</p>
          </article>
          <article class="fact-card">
            <span>2025年の食料</span>
            <strong>+6.8%</strong>
            <p>食料指数の前年比。生鮮食品を除く食料は前年比7.0%上昇。</p>
          </article>
          <article class="fact-card">
            <span>制度の検証</span>
            <strong>進行中</strong>
            <p>厚生労働省の生活保護基準部会で、2026年の基準検証が進められています。</p>
          </article>
        </div>
        <div class="campaign-truth">
          <p>数字の言い方</p>
          <div><strong>言えること</strong><span>総合CPIは2013年から2025年までに約17.9%上昇した。</span></div>
          <div><strong>言い切らないこと</strong><span>すべての生活保護世帯の実負担が同じ割合で増えた、支給額が一度も変わっていない。</span></div>
        </div>
      </section>

      <section class="campaign-section campaign-requests" id="requests">
        <header class="campaign-section__head">
          <span class="campaign-label">02 / OUR ASK</span>
          <h2>求めるのは、<br>毎年きちんと追いつく仕組み。</h2>
          <p>敵を増やす主張ではなく、検証できる3つの制度改善に絞ります。</p>
        </header>
        <ol class="request-list">
          <li>
            <span>1</span>
            <div><h3>最低生活費を毎年、物価に連動</h3><p>全国平均だけでなく、低所得世帯の食料・光熱費など必需支出を重く見た指標で改定する。</p></div>
          </li>
          <li>
            <span>2</span>
            <div><h3>2026年の検証に最新データと当事者の声を反映</h3><p>2025～26年の価格変化、買い控え、健康への影響を調べ、受給当事者へのヒアリングを公開して行う。</p></div>
          </li>
          <li>
            <span>3</span>
            <div><h3>算定式と世帯別の影響を公開</h3><p>どのデータをどう使ったか、世帯類型ごとに増減がいくらかを、誰でも検証できる形で公表する。</p></div>
          </li>
        </ol>
        <div class="campaign-judgment">
          <span>WHY NOW</span>
          <p>2013～15年の生活扶助基準改定は、2025年6月の最高裁判決で判断過程・手続の過誤や欠落を理由に違法とされました。次の改定こそ、専門的検討と透明性が必要です。</p>
          <a href="${campaignSources.judgment}" target="_blank" rel="noreferrer">厚生労働省の判決対応ページ ↗</a>
        </div>
      </section>

      <section class="campaign-section campaign-action" id="action">
        <header class="campaign-section__head">
          <span class="campaign-label">03 / TAKE ACTION</span>
          <h2>3分からできること。</h2>
          <p>同じ文の連投ではなく、署名・意見・共有を一度ずつ丁寧に。数よりも、記録に残る具体的な声を増やします。</p>
        </header>
        <div class="action-grid">
          <article>
            <span class="action-number">01</span>
            <h3>署名する</h3>
            <p>Change.orgの請願に賛同し、可能なら「なぜ必要か」を一言添えます。</p>
            <a class="campaign-button campaign-button--primary" href="${campaignSources.petition}" target="_blank" rel="noreferrer">署名ページへ ↗</a>
          </article>
          <article>
            <span class="action-number">02</span>
            <h3>厚労省へ送る</h3>
            <p>下の要望文をコピーし、「国民の皆様の声」フォームから送れます。</p>
            <a class="campaign-button campaign-button--ink" href="${campaignSources.opinion}" target="_blank" rel="noreferrer">意見フォームへ ↗</a>
          </article>
          <article>
            <span class="action-number">03</span>
            <h3>電話で伝える</h3>
            <p><a href="tel:0352531111">03-5253-1111</a>（厚生労働省代表・平日18時15分まで）。生活扶助基準についての意見と伝え、担当部署への記録を依頼します。</p>
            <button class="campaign-button campaign-button--ink" type="button" data-copy-target="phone-copy">30秒メモをコピー</button>
          </article>
          <article>
            <span class="action-number">04</span>
            <h3>1人に共有する</h3>
            <p>不特定多数への連投より、関心のある知人や支援者へ個別に共有するほうが届きます。</p>
            <button class="campaign-button campaign-button--paper" type="button" data-share-campaign>共有する</button>
          </article>
        </div>
        <p class="action-caution">相手を威圧する言動、業務を妨げる反復連絡、掲示板のルールに反する投稿はしません。個人情報や受給状況は、伝えたくなければ書く必要はありません。</p>
      </section>

      <section class="campaign-section campaign-copy" id="copy">
        <header class="campaign-section__head">
          <span class="campaign-label">04 / COPY & SHARE</span>
          <h2>そのまま使える。<br>自分の言葉を一文足せる。</h2>
          <p>攻撃的な表現を外し、事実・要求・行動の順に整えました。</p>
        </header>
        <div class="copy-stack">
          <article>
            <div class="copy-head"><div><span>厚労省フォーム</span><h3>政策要望文</h3></div><button type="button" data-copy-target="mhlw-copy">コピー</button></div>
            <pre id="mhlw-copy">件名：生活扶助基準の物価連動と2026年検証への要望

生活扶助基準について、次の4点を要望します。

1. 生活扶助基準を、低所得世帯の食料・光熱費など必需支出を反映した物価指標に毎年連動させてください。
2. 2026年の基準検証に、2025～26年の物価と生活実態、受給当事者へのヒアリングを反映してください。
3. 算定式、使用データ、世帯類型ごとの影響額を公表してください。
4. 高い物価上昇が続く間、実質的な生活水準を後退させないでください。

総務省統計局の全国・総合CPIは、2013年平均94.9から2025年平均111.9へ約17.9%上昇しています。2025年の食料指数も前年比6.8%上昇しました。

2025～26年度の特例加算や、2026年10月から予定される追加措置は承知しています。しかし、一時的な定額加算ではなく、暮らしの実態に毎年追いつく透明な仕組みが必要です。今後の検討に反映してください。</pre>
          </article>
          <article>
            <div class="copy-head"><div><span>5ch・掲示板</span><h3>短い紹介文</h3></div><button type="button" data-copy-target="board-copy">コピー</button></div>
            <pre id="board-copy">【署名】最低生活費を物価に連動させよう

総務省の全国・総合CPIは、2013年平均94.9 → 2025年平均111.9。12年間で約17.9%上昇。

生活扶助には2025～26年度に月1人1,500円の特例加算がありますが、一時措置ではなく、食料・光熱費など必需品の値上がりに毎年追いつく仕組みを求めます。

要求は3点：
・最低生活費を毎年、物価に連動
・2026年検証に最新データと当事者の声を反映
・算定式と世帯別の影響を公開

署名：https://chng.it/w2Yyn4wB4R
根拠と要望文：https://univgov.pages.dev/seikatsuhogo/

※同じ文の連投はせず、各掲示板のルールを守ってください。</pre>
          </article>
          <article>
            <div class="copy-head"><div><span>X・SNS</span><h3>共有文</h3></div><button type="button" data-copy-target="social-copy">コピー</button></div>
            <pre id="social-copy">2013→2025年で総合物価は約17.9%上昇。生活扶助に必要なのは一時加算だけでなく、食料・光熱費の値上がりに毎年追いつく透明な仕組みです。最低生活費を物価に連動させよう。署名と根拠はこちら→ https://univgov.pages.dev/seikatsuhogo/ #くらしの最低線</pre>
          </article>
          <article class="copy-visually-hidden">
            <pre id="phone-copy">生活扶助基準について意見を伝えたいです。物価上昇への対応を一時加算だけで終わらせず、毎年の物価連動として制度化し、算定根拠を公開してください。2026年の検証には受給当事者の生活実態を反映してください。この意見を担当部署に記録してください。</pre>
          </article>
        </div>
      </section>

      <section class="campaign-section campaign-faq" id="faq">
        <header class="campaign-section__head">
          <span class="campaign-label">05 / FAQ</span>
          <h2>よくある疑問。</h2>
        </header>
        <div class="faq-list">
          <details>
            <summary>生活保護の支給額は、本当に据え置きですか？</summary>
            <p>いいえ。「全く上がっていない」という表現は正確ではありません。2025～26年度は月1人1,500円の特例加算があり、2026年10月から1年間はさらに1,000円を加算する予定です。本キャンペーンは、その場限りの措置ではなく、毎年の透明な物価連動を求めます。</p>
          </details>
          <details>
            <summary>一律で月3万円上げる主張ですか？</summary>
            <p>本ページでは、根拠の確認できない一律額を掲げません。年齢・世帯・地域によって基準が異なるため、低所得世帯の必需支出を使って再計算し、世帯別の影響額を公開するよう求めます。</p>
          </details>
          <details>
            <summary>総合CPIだけで決めればよいのですか？</summary>
            <p>総合CPIは出発点であって、十分ではありません。所得が低いほど食費や光熱費の比重が大きくなりやすいため、低所得世帯の消費構造と買い控えも含めた補完指標が必要です。</p>
          </details>
          <details>
            <summary>受給していなくても参加できますか？</summary>
            <p>参加できます。生活保護は、病気、障害、失業、介護などで生活が立ち行かなくなったときの最後の安全網です。誰でも利用する可能性がある制度として意見を届けられます。</p>
          </details>
        </div>
      </section>

      <section class="campaign-section campaign-sources" id="sources">
        <header class="campaign-section__head">
          <span class="campaign-label">06 / SOURCES</span>
          <h2>出典を開いて、<br>自分で確かめる。</h2>
          <p>2026年7月27日確認。数字や制度が更新されたら、本ページも更新します。</p>
        </header>
        <ol>
          <li><a href="${campaignSources.cpi}" target="_blank" rel="noreferrer"><span>総務省統計局</span><strong>2025年平均 消費者物価指数（全国） ↗</strong></a></li>
          <li><a href="${campaignSources.standards}" target="_blank" rel="noreferrer"><span>厚生労働省</span><strong>令和8年度生活扶助基準の見直しの内容（PDF） ↗</strong></a></li>
          <li><a href="${campaignSources.review}" target="_blank" rel="noreferrer"><span>厚生労働省</span><strong>社会保障審議会 生活保護基準部会 ↗</strong></a></li>
          <li><a href="${campaignSources.judgment}" target="_blank" rel="noreferrer"><span>厚生労働省</span><strong>平成25年生活扶助基準改定に関する最高裁判決への対応 ↗</strong></a></li>
          <li><a href="${campaignSources.opinion}" target="_blank" rel="noreferrer"><span>厚生労働省</span><strong>「国民の皆様の声」募集 送信フォーム ↗</strong></a></li>
          <li><a href="${campaignSources.contact}" target="_blank" rel="noreferrer"><span>厚生労働省</span><strong>お問い合わせ窓口 ↗</strong></a></li>
        </ol>
      </section>

      <section class="campaign-final">
        <p>一時しのぎから、仕組みへ。</p>
        <h2>暮らしの最低線を、<br>物価の下に置き去りにしない。</h2>
        <div class="campaign-actions">
          <a class="campaign-button campaign-button--primary" href="${campaignSources.petition}" target="_blank" rel="noreferrer">署名に参加する ↗</a>
          <a class="campaign-button campaign-button--paper" href="#copy">要望文をコピーする ↑</a>
        </div>
      </section>
      <div class="campaign-toast" role="status" aria-live="polite" data-campaign-toast></div>`,
  });
}

async function write(path, contents) {
  await mkdir(dirname(resolve(out, path)), { recursive: true });
  await writeFile(resolve(out, path), contents);
}

async function prepareSitesOutput() {
  const client = resolve(out, "client");
  await mkdir(client, { recursive: true });
  for (const entry of ["index.html", "404.html", "articles", "assets", "seikatsuhogo"]) {
    await cp(resolve(out, entry), resolve(client, entry), { recursive: true });
  }
  await write("server/index.js", `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") url.pathname = "/seikatsuhogo/";
    return env.ASSETS.fetch(new Request(url, request));
  },
};
`);
}

async function build() {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  const renderedArticles = new Map();
  for (const article of articles) {
    const markdown = await readFile(resolve(root, article.source), "utf8");
    renderedArticles.set(article.slug, renderMarkdown(markdown));
  }
  await write("index.html", homepage(renderedArticles));
  for (const article of articles) {
    await write(`articles/${article.slug}.html`, articlePage(article, renderedArticles.get(article.slug)));
  }
  await write("seikatsuhogo/index.html", campaignPage());
  await write("404.html", shell({
    title: `404 — ${site.name}`,
    description: "ページが見つかりません。",
    content: '<section class="not-found"><span>ERROR / 404</span><h1>軌道から外れました。</h1><p>指定されたページは存在しないか、別の座標へ移動しました。</p><a class="button primary" href="/">ホームへ戻る →</a></section>',
  }));
  await write("assets/search-index.json", JSON.stringify(articles.map((article) => ({
    title: renderedArticles.get(article.slug).title,
    summary: article.summary,
    label: article.label,
    url: `/articles/${article.slug}`,
  }))));
  await cp(resolve(root, "site/assets"), resolve(out, "assets"), { recursive: true });
  await prepareSitesOutput();
  console.log(`Built ${articles.length} articles and the campaign page into dist/`);
}

await build();
