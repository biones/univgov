import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import QRCode from "qrcode";
import { articles, site, i18n } from "./site.config.mjs";
import { generateAllAiMarkdown } from "../scripts/generate_univgov_complete_md.mjs";

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
  if (!markdown) return { title: "Draft", html: "", toc: [] };
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
      body.push(`<h${level} id="${id}">${inline(text)}<a class="heading-anchor" href="#${id}" aria-label="anchor">#</a></h${level}>`);
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

const formatDate = (date, lang) => {
  if (lang === "en") {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric", month: "long", day: "numeric",
    }).format(new Date(`${date}T00:00:00+09:00`));
  }
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric", month: "long", day: "numeric",
  }).format(new Date(`${date}T00:00:00+09:00`));
};

const getPrefix = (lang) => lang === "en" ? "/en" : "";

const nav = (active = "", locale) => `
  <header class="site-header">
    <a class="brand" href="${getPrefix(locale.lang)}/" aria-label="${site.name} ${locale.nav.home}">
      <span>UNIVGOV</span>
    </a>
    <nav aria-label="Navigation">
      <a href="${getPrefix(locale.lang)}/">${locale.nav.home}</a>
      <a ${active === "articles" ? 'aria-current="page"' : ""} href="${getPrefix(locale.lang)}/#articles">${locale.nav.articles}</a>
      <a href="${getPrefix(locale.lang)}/#rules">${locale.nav.rules}</a>
      <a href="${getPrefix(locale.lang)}/articles/space-law-v1">${locale.nav.spaceLaw}</a>
      <a href="https://discord.gg/HwqkcrMUG9" target="_blank" rel="noopener noreferrer" style="color: #818cf8; font-weight: 600;">${locale.nav.parliament} ↗</a>
      <a ${active === "portal" ? 'aria-current="page"' : ""} href="${getPrefix(locale.lang)}/portal" class="nav-portal-btn" data-nav-portal style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.35); color: #38bdf8; font-weight: 700; border-radius: 6px; padding: 6px 12px;">🔑 ${locale.lang === "en" ? "Sign In / Portal" : "ログイン / マイポータル"}</a>
      <button class="search-trigger" type="button" data-search-open aria-label="${locale.nav.search}">${locale.nav.search}</button>
      <a href="${locale.ui.langLink}" class="lang-switcher">${locale.ui.langSwitcher}</a>
    </nav>
  </header>`;

const shell = ({
  title,
  description,
  content,
  active = "",
  bodyClass = "",
  canonical = "",
  jaCanonical = "",
  enCanonical = "",
  ogImage = "",
  locale,
  jsonLd = null,
}) => {
  const altLang = locale.lang === "ja" ? "en" : "ja";
  const altLocale = i18n[altLang];
  const prefix = getPrefix(locale.lang);
  const defaultOgImage = ogImage || `${site.baseUrl}${site.ogImageDefault}`;

  const analyticsScript = site.cloudflareAnalyticsToken
    ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${site.cloudflareAnalyticsToken}"}'></script>`
    : "";
  const utmTrackerScript = `<script>
  (function() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
      let hasUtm = false;
      const utmObj = {};
      utmKeys.forEach(key => {
        if (urlParams.has(key)) {
          utmObj[key] = urlParams.get(key);
          hasUtm = true;
        }
      });
      if (hasUtm) {
        sessionStorage.setItem('univgov_utm', JSON.stringify(utmObj));
      }
    } catch (e) {}
  })();
  </script>`;

  const jsonLdScript = jsonLd ? `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>` : "";

  return `<!doctype html>
<html lang="${locale.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="${escapeHtml(locale.keywords)}">
  <meta name="author" content="${escapeHtml(site.author)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  ${canonical ? `<link rel="canonical" href="${canonical}">` : ""}
  ${jaCanonical ? `<link rel="alternate" hreflang="ja" href="${jaCanonical}">` : ""}
  ${enCanonical ? `<link rel="alternate" hreflang="en" href="${enCanonical}">` : ""}
  ${jaCanonical ? `<link rel="alternate" hreflang="x-default" href="${jaCanonical}">` : ""}
  <meta name="theme-color" content="#090c10">
  <meta property="og:type" content="${active === "articles" ? "article" : "website"}">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:locale" content="${locale.localeTag}">
  <meta property="og:locale:alternate" content="${altLocale.localeTag}">
  ${canonical ? `<meta property="og:url" content="${canonical}">` : ""}
  <meta property="og:image" content="${defaultOgImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="${site.twitterHandle}">
  <meta name="twitter:creator" content="${site.twitterHandle}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${defaultOgImage}">
  <link rel="icon" href="/assets/univgov-logo.jpg" type="image/jpeg">
  <link rel="stylesheet" href="/assets/styles.css">
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  <script src="/assets/site.js" defer></script>
  ${jsonLdScript}
  ${analyticsScript}
  ${utmTrackerScript}
</head>
<body class="${bodyClass}">
  <div class="ambient" aria-hidden="true"></div>
  ${nav(active, locale)}
  <main id="main">${content}</main>
  <footer class="site-footer">
    <div class="footer-brand"><span class="signal" aria-hidden="true"></span>${site.name}</div>
    <div style="display: flex; gap: 16px; align-items: center; justify-content: center; flex-wrap: wrap;">
      <a href="${site.discordUrl}" target="_blank" rel="noopener noreferrer" style="color: #818cf8; font-size: 0.9rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
        <span style="font-size: 1.1rem;">💬</span> <strong>${locale.nav.parliament}</strong>
      </a>
      <a href="${prefix}/portal" style="color: #38bdf8; font-size: 0.9rem; text-decoration: none;">${locale.nav.portal}</a>
    </div>
    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; margin-top: 6px;">
      <a href="${prefix === "" ? "/univgov_all.md" : "/univgov_all.en.md"}" target="_blank" style="color: #94a3b8; font-size: 0.82rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
        <span>🤖</span> <span>${locale.lang === "en" ? "Full Text for AI (.md)" : "AI用 全論考・思想録 (.md)"}</span>
      </a>
      <span style="color: #475569; font-size: 0.8rem;">|</span>
      <a href="/llms.txt" target="_blank" style="color: #94a3b8; font-size: 0.82rem; text-decoration: none;">llms.txt</a>
    </div>
    <div class="access-counter-wrap" title="${locale.lang === "en" ? "Cosmic Law Art. 42: No guestbook posting required" : "宇宙法第42条：キリ番報告・BBSカキコ義務免除"}">
      <span class="counter-label">${locale.lang === "en" ? "Cosmic Traveler #" : "あなたは "}</span>
      <div class="access-counter-box" data-access-counter>
        <span class="counter-digit">0</span><span class="counter-digit">0</span><span class="counter-digit">0</span><span class="counter-digit">0</span><span class="counter-digit">0</span><span class="counter-digit">0</span><span class="counter-digit">0</span><span class="counter-digit">1</span>
      </div>
      <span class="counter-label-post">${locale.lang === "en" ? " (Kiriban report optional)" : " 人目の宇宙脱出者です（※キリ番報告不要・踏み逃げ歓迎）"}</span>
    </div>
    <a href="#top">${locale.ui.top}</a>
  </footer>
  <dialog class="search-dialog" data-search-dialog aria-label="${locale.nav.search}">
    <form method="dialog"><button aria-label="Close">×</button></form>
    <label for="site-search">${locale.nav.search}</label>
    <input id="site-search" type="search" placeholder="${locale.ui.searchPlaceholder}" autocomplete="off" data-search-input>
    <div class="search-results" data-search-results></div>
  </dialog>
</body>
</html>`;
};

const card = (article, rendered, locale) => {
  const prefix = getPrefix(locale.lang);
  const displayTitle = locale.lang === "en" ? article.displayTitleEn : article.displayTitle;
  const summary = locale.lang === "en" ? article.summaryEn : article.summary;
  const label = locale.lang === "en" ? article.labelEn : article.label;
  const readStr = locale.lang === "en" ? article.readEn : article.read;
  
  return `
  <article class="article-card accent-${article.accent}" data-article-card data-search-text="${escapeHtml(`${rendered.title} ${summary} ${label}`.toLowerCase())}">
    <div class="card-meta"><span>${label}</span><time datetime="${article.date}">${article.date.replaceAll("-", ".")}</time></div>
    <h3><a href="${prefix}/articles/${article.slug}">${inline(displayTitle ?? rendered.title)}</a></h3>
    <p>${escapeHtml(summary)}</p>
    <div class="card-foot"><span>${readStr}</span><a aria-label="Read ${escapeHtml(rendered.title)}" href="${prefix}/articles/${article.slug}">${locale.ui.read}</a></div>
  </article>`;
};

function homepage(renderedArticles, locale) {
  const prefix = getPrefix(locale.lang);
  const featured = articles.filter((item) => item.featured).map((item) => card(item, renderedArticles.get(item.slug), locale)).join("");
  const allCards = articles.map((item) => card(item, renderedArticles.get(item.slug), locale)).join("");
  const canonical = `${site.baseUrl}${prefix}/`;
  const jaCanonical = `${site.baseUrl}/`;
  const enCanonical = `${site.baseUrl}/en/`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${site.baseUrl}/#website`,
        "url": canonical,
        "name": site.name,
        "alternateName": ["宇宙政府", "UNIVGOV", "Universe Government", "宇宙政府プロジェクト"],
        "description": locale.description,
        "inLanguage": locale.lang,
        "publisher": {
          "@type": "Organization",
          "name": site.name,
          "alternateName": ["宇宙政府", "UNIVGOV", "Universe Government"],
          "url": site.baseUrl,
          "logo": {
            "@type": "ImageObject",
            "url": `${site.baseUrl}${site.ogImageDefault}`
          }
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${canonical}?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "@id": `${site.baseUrl}/#organization`,
        "name": site.name,
        "alternateName": ["宇宙政府", "UNIVGOV", "Universe Government"],
        "url": site.baseUrl,
        "logo": `${site.baseUrl}${site.ogImageDefault}`,
        "description": locale.description,
        "sameAs": [
          "https://x.com/univgov"
        ]
      }
    ]
  };

  return shell({
    title: `${site.name} — ${locale.tagline}`,
    description: locale.description,
    bodyClass: "home",
    canonical,
    jaCanonical,
    enCanonical,
    locale,
    jsonLd,
    content: `
      <section class="hero" id="top">
        <div class="hero-banner">
          <img src="/assets/univgov-logo.jpg" alt="UNIVGOV Logo" width="540" height="540">
          <h1>UNIVGOV</h1>
          <img src="/assets/univgov-logo.jpg" alt="" width="540" height="540">
        </div>
        <div class="hero-intro">
          <p class="kicker">${locale.ui.heroKicker}</p>
          <h2>${locale.ui.heroTitle}</h2>
          <p class="lead">${locale.ui.heroLead1}</p>
          <p class="lead">${locale.ui.heroLead2}</p>
          <div class="hero-actions">
            <a class="button primary" href="#rules">${locale.ui.readPrinciples}</a>
            <a class="button ghost" href="#articles">${locale.ui.readArticles}</a>
          </div>
        </div>
      </section>

      <!-- 3 Pathways Section -->
      <section class="pathways-section" style="margin: 40px auto; max-width: 1120px; padding: 0 20px;">
        <div class="section-head">
          <div>
            <span>00 / PATHWAYS</span>
            <h2>${locale.lang === "en" ? "Where to Begin: 3 Entry Points" : "あなたに合った最初の入り口"}</h2>
          </div>
          <p>${locale.lang === "en" ? "Choose the pathway that matches your perspective to explore Univgov." : "立場や関心に合わせて、宇宙政府の思想と道具にアクセスできます。"}</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 24px;">
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px;">
            <div style="font-size: 1.8rem; margin-bottom: 12px;">🌱</div>
            <h3 style="font-size: 1.15rem; margin-bottom: 8px; color: #38bdf8;">${locale.lang === "en" ? "For General Citizens" : "一般市民・生活者向け"}</h3>
            <p style="font-size: 0.9rem; color: #94a3b8; line-height: 1.6; margin-bottom: 16px;">
              ${locale.lang === "en" ? "Why is your physical address tied to all administrative services? Discover how to unbundle your life from state monopoly." : "なぜ住む場所と行政サービスが一体なのか？国家の抱き合わせを解体し、生活防衛と帰属選択を始める基礎論。"}
            </p>
            <a href="${prefix}/articles/address-is-not-allegiance" style="color: #38bdf8; font-size: 0.88rem; font-weight: 600; text-decoration: none;">${locale.lang === "en" ? "Read 'Address is Not Allegiance' →" : "『住所と所属を切り分ける』を読む →"}</a>
          </div>
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px;">
            <div style="font-size: 1.8rem; margin-bottom: 12px;">📊</div>
            <h3 style="font-size: 1.15rem; margin-bottom: 8px; color: #f59e0b;">${locale.lang === "en" ? "For Policy & Field Stakeholders" : "政策・福祉・現場当事者向け"}</h3>
            <p style="font-size: 0.9rem; color: #94a3b8; line-height: 1.6; margin-bottom: 16px;">
              ${locale.lang === "en" ? "Real-world policy evaluation cards (e.g. Welfare B-type reforms, school lunches) using open data and empirical cost-benefit metrics." : "就労継続支援B型や給食予算など、現場の制度疲労と公金配分を『政策評価カード』でデータ検証するパイロット事例。"}
            </p>
            <a href="${prefix}/articles/stress-test" style="color: #f59e0b; font-size: 0.88rem; font-weight: 600; text-decoration: none;">${locale.lang === "en" ? "View Policy Evaluation Card →" : "政策評価カードの実例を見る →"}</a>
          </div>
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px;">
            <div style="font-size: 1.8rem; margin-bottom: 12px;">⚙️</div>
            <h3 style="font-size: 1.15rem; margin-bottom: 8px; color: #a855f7;">${locale.lang === "en" ? "For Engineers & AI Agents" : "技術者・AIエージェント向け"}</h3>
            <p style="font-size: 0.9rem; color: #94a3b8; line-height: 1.6; margin-bottom: 16px;">
              ${locale.lang === "en" ? "ZK-KYC, DIDs, multi-sig governance, and single-file complete Markdown for LLM analysis." : "ゼロ知識証明、DID、マルチシグ統治、およびAIが1発で全思想を読み込める統合Markdown（univgov_all.md / llms.txt）。"}
            </p>
            <a href="${prefix === "" ? "/univgov_all.md" : "/univgov_all.en.md"}" target="_blank" style="color: #a855f7; font-size: 0.88rem; font-weight: 600; text-decoration: none;">${locale.lang === "en" ? "Access Full Markdown for AI →" : "AI向け完全統合Markdownを開く →"}</a>
          </div>
        </div>
      </section>

      <section class="featured-section" aria-labelledby="featured-title">
        <div class="section-head"><div><span>01 / FEATURED</span><h2 id="featured-title">${locale.ui.featuredTitle}</h2></div><p>${locale.ui.featuredSub}</p></div>
        <div class="featured-grid">${featured}</div>
      </section>

      <section class="manifesto-band">
        <h2>${locale.ui.manifestoTitle}</h2>
        <a href="${prefix}/articles/hundred-year-thesis">${locale.ui.readManifesto}</a>
      </section>

      <section class="principles" id="rules" aria-labelledby="principles-title">
        <div class="section-head"><div><span>02 / PRINCIPLES</span><h2 id="principles-title">${locale.ui.principlesTitle}</h2></div><p>${locale.ui.principlesSub}</p></div>
        <ol class="principle-list">${locale.principles.map(([n, title, text]) => `<li><span>${n}</span><h3>${title}</h3><p>${text}</p></li>`).join("")}</ol>
      </section>

      <section class="archive" id="articles" aria-labelledby="archive-title">
        <div class="section-head"><div><span>03 / ARCHIVE</span><h2 id="archive-title">${locale.ui.archiveTitle}</h2></div><div class="archive-tools"><label for="archive-search">${locale.ui.archiveFilter}</label><input id="archive-search" type="search" placeholder="${locale.ui.searchPlaceholder}" data-card-filter></div></div>
        <div class="article-grid" data-card-grid>${allCards}</div>
        <p class="empty-state" data-empty-state hidden>${locale.ui.notFound}</p>
      </section>

      <section class="registration" id="register" aria-labelledby="register-title">
        <div class="section-head">
          <div>
            <span>04 / REGISTRATION & LOGIN</span>
            <h2 id="register-title">${locale.ui.registerTitle}</h2>
          </div>
          <p>${locale.ui.registerDesc}</p>
        </div>
        <div class="registration-container" style="max-width: 540px; margin: 0 auto; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px 24px; text-align: center;">
          <div style="font-size: 2.4rem; margin-bottom: 12px;">🛡️</div>
          <h3 style="font-size: 1.25rem; color: #fff; margin: 0 0 8px 0;">${locale.lang === "en" ? "Instant Cosmic Citizen Verification" : "Googleワンクリックで宇宙国民証を発行"}</h3>
          <p style="font-size: 0.9rem; color: #94a3b8; line-height: 1.6; margin: 0 0 24px 0;">
            ${locale.lang === "en" ? "Authenticate via Google to automatically issue your Citizen ID and unlock My Portal services. No passwords required." : "Googleアカウントで認証すると、即座にあなたのデジタル宇宙国民証が発行され、マイポータルの全機能が有効化されます。面倒なパスワード管理は不要です。"}
          </p>

          <!-- Google Sign-In Container -->
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;">
            <div id="g_id_onload"
                 data-client_id="${site.googleClientId}"
                 data-context="signin"
                 data-ux_mode="popup"
                 data-callback="handleGoogleLoginResponse"
                 data-auto_prompt="false">
            </div>

            <div id="g_id_signin_home" class="g_id_signin"
                 data-type="standard"
                 data-shape="pill"
                 data-theme="filled_blue"
                 data-text="signin_with"
                 data-size="large"
                 data-logo_alignment="left"
                 data-width="280">
            </div>

            <!-- Fallback / Custom Button -->
            <button type="button" id="btn-custom-google-login" class="button primary" style="display: inline-flex; align-items: center; justify-content: center; gap: 10px; font-weight: 700; font-size: 1rem; padding: 12px 28px; width: 100%; max-width: 320px; background: #2563eb; border-color: #3b82f6;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>${locale.lang === "en" ? "Sign in with Google" : "Googleでサインイン / 発行"}</span>
            </button>
          </div>

          <div id="citizen-register-feedback" class="citizen-feedback-box" hidden style="margin-top: 20px;">
            <div class="feedback-icon" style="font-size: 2.2rem; margin-bottom: 8px;">🚀</div>
            <h3 id="feedback-title" style="font-size: 1.2rem; margin: 0 0 8px 0; color: #fff;">${locale.ui.registerSuccess}</h3>
            <p id="feedback-desc" style="color: #94a3b8; font-size: 0.95rem; margin: 0 0 16px 0;">${locale.lang === "en" ? "Redirecting to My Portal..." : "マイポータルへ移動しています..."}</p>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 0.8rem; color: #64748b; line-height: 1.5;">
            🔒 ${locale.lang === "en" ? "Exit Guarantee: You can permanently erase all account data at any time from My Portal with 1-click." : "EXIT権の保証：ポータル内の設定からいつでもワンクリックで全登録データを完全抹消・脱退可能です。"}
          </div>
        </div>
      </section>

      <section class="parliament-section" id="parliament" aria-labelledby="parliament-title">
        <div class="section-head">
          <div>
            <span>05 / PARLIAMENT</span>
            <h2 id="parliament-title">${locale.ui.parliamentTitle}</h2>
          </div>
          <p>${locale.ui.parliamentSub}</p>
        </div>

        <div class="parliament-grid-box">
          <!-- X Parliament Card -->
          <div class="parliament-card x-platform">
            <div class="parliament-card-header">
              <span class="platform-icon">𝕏</span>
              <div>
                <h3>${locale.ui.parliamentXTitle}</h3>
                <p>${locale.ui.parliamentXDesc}</p>
              </div>
            </div>

            <div class="hashtag-table">
              <div class="hashtag-row">
                <code>#UNIVGOV</code>
                <span>${locale.lang === "en" ? "General discussions, questions, and citizen voices" : "総合議論・意見表明・宇宙国民としての発言"}</span>
              </div>
              <div class="hashtag-row">
                <code>#UNIVGOV_BILL</code>
                <span>${locale.lang === "en" ? "Formal policy proposals, space law amendments" : "法案・政策の起草・改善提案（プレフィックス統一）"}</span>
              </div>
              <div class="hashtag-row">
                <code>#UNIVGOV_VOTE</code>
                <span>${locale.lang === "en" ? "Voting, referendum tallying, consensus checks" : "投票・賛否表明・国民投票の集計用"}</span>
              </div>
            </div>

            <div class="parliament-actions">
              <a href="https://x.com/intent/post?text=${encodeURIComponent('【宇宙政府 政策提案】\n\n#UNIVGOV_BILL #UNIVGOV\nhttps://univgov.pages.dev')}" target="_blank" rel="noopener noreferrer" class="button primary small">✍️ ${locale.ui.parliamentPostBill}</a>
              <a href="https://x.com/intent/post?text=${encodeURIComponent('【宇宙政府 議会発言】\n\n#UNIVGOV #宇宙政府\nhttps://univgov.pages.dev')}" target="_blank" rel="noopener noreferrer" class="button secondary small">💬 ${locale.ui.parliamentPostOpinion}</a>
              <a href="https://x.com/search?q=%23UNIVGOV&f=live" target="_blank" rel="noopener noreferrer" class="button ghost small">🔍 ${locale.ui.parliamentSearch}</a>
            </div>
          </div>

          <!-- Discord Parliament Card -->
          <div class="parliament-card discord-platform">
            <div class="parliament-card-header">
              <span class="platform-icon">💬</span>
              <div>
                <h3>${locale.lang === "en" ? "Discord Permanent Council & Workgroups" : "Discord 常任委員会・作業部会"}</h3>
                <p>${locale.lang === "en" ? "Real-time discussions, modular development workgroups, and drafting chambers." : "リアルタイムの審議、法案の共同ドラフト作業、技術モジュールの開発ワーキンググループ。"}</p>
              </div>
            </div>

            <div class="discord-features">
              <ul>
                <li>🏛️ <strong>${locale.lang === "en" ? "General Assembly Chamber" : "宇宙議会 本会議場"}</strong>: ${locale.lang === "en" ? "Live open townhalls & hearings" : "公聴会・リアルタイム討議"}</li>
                <li>📜 <strong>${locale.lang === "en" ? "Law Drafting Room" : "法案起草・審査室"}</strong>: ${locale.lang === "en" ? "Collaborative policy writing" : "宇宙基本法・モジュール仕様の共同編集"}</li>
                <li>⚙️ <strong>${locale.lang === "en" ? "Developer Guild" : "技術実装ギルド"}</strong>: ${locale.lang === "en" ? "Identity, currency, and portal coding" : "ID・認証・ポータルシステムの開発"}</li>
              </ul>
            </div>

            <div class="parliament-actions">
              <a href="${site.discordUrl}" target="_blank" rel="noopener noreferrer" class="button" style="background: #5865F2; color: #fff; border: 1px solid #5865F2; font-weight: bold;">💬 ${locale.ui.joinParliament}</a>
            </div>
          </div>
        </div>
      </section>

      <section class="btc-zone-section" id="btc-zone" aria-labelledby="btc-zone-title">
        <div class="section-head">
          <div>
            <span>06 / CURRENCY & BTC ZONE</span>
            <h2 id="btc-zone-title">${locale.ui.btcZoneTitle}</h2>
          </div>
          <p>${locale.ui.btcZoneSub}</p>
        </div>

        <div class="btc-zone-grid">
          <!-- Cosmic Currency UNI Protocol -->
          <div class="btc-zone-card accent-uni" style="border-color: rgba(56, 189, 248, 0.35); background: linear-gradient(145deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%);">
            <div class="zone-card-icon" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8;">🪐</div>
            <h3 style="color: #38bdf8;">${locale.lang === "en" ? "0. Cosmic Currency UNI (10⁶ Grant)" : "0. 宇宙通貨 UNI（初期付与 10⁶ UNI）"}</h3>
            <p>${locale.lang === "en" ? "Every registered citizen receives 1,000,000 UNI as an initial grant. A floating, non-state currency (~1 JPY scale) for instant P2P transfers & modular settlement." : "宇宙国民アカウントを開設した全市民に 1,000,000 UNI を初期交付。国家のシニョリッジを排し、約1円スケール（変動相場）で市民間直接決済・価値交換を実現。"}</p>
            <a href="${prefix}/portal" class="button primary small" style="background: #0284c7; border-color: #38bdf8;">🪐 ${locale.lang === "en" ? "Open UNI Vault →" : "UNI ウォレットを開く →"}</a>
          </div>

          <!-- Salary Protocol -->
          <div class="btc-zone-card">
            <div class="zone-card-icon">💼</div>
            <h3>${locale.lang === "en" ? "1. BTC Salary & Freelance Revenue" : "1. 給料・売上のビットコイン受取"}</h3>
            <p>${locale.lang === "en" ? "Legally receive 10%-100% of your compensation in Bitcoin. Generate formal employer request forms instantly from My Portal." : "労働基準法に基づく合意書フォーマットを使い、給与や業務委託報酬をLightning/BTCで受け取る。マイポータルから公式申請書を1秒で出力可能。"}</p>
            <a href="${prefix}/portal" class="button primary small">📄 ${locale.lang === "en" ? "Generate Salary Form →" : "給与受取 申請書を出力 →"}</a>
          </div>

          <!-- Supermarket Protocol -->
          <div class="btc-zone-card">
            <div class="zone-card-icon">🛒</div>
            <h3>${locale.lang === "en" ? "2. Daily Supermarket & Grocery Payments" : "2. 近所のスーパー・日用品でのBTC決済"}</h3>
            <p>${locale.lang === "en" ? "Spend Bitcoin at supermarkets, convenience stores, and pharmacies instantly via Visa/Mastercard crypto debit cards or digital gift cards." : "Visa/Mastercardプリペイドカード（Slash Card等）やデジタル金券を使い、イオン・西友・ライフ・コンビニ等でQUICPay/タッチ決済で1秒利用。"}</p>
            <a href="${prefix}/portal" class="button secondary small">🛒 ${locale.lang === "en" ? "View Grocery Guide →" : "スーパー決済ナビを見る →"}</a>
          </div>

          <!-- Store Onboarding -->
          <div class="btc-zone-card">
            <div class="zone-card-icon">🏪</div>
            <h3>${locale.lang === "en" ? "3. Merchant POP Stand & POS Kit" : "3. 店舗・事業主向け 決済導入キット"}</h3>
            <p>${locale.lang === "en" ? "Personal stores, cafes, and creators can print physical register QR stands linked directly to their Cosmic Citizen ID & Lightning address." : "カフェ・個人商店・出展者が、自身の宇宙国民IDとLightningアドレスが入った店頭決済POPスタンドをワンクリック印刷・設置可能。"}</p>
            <a href="${prefix}/portal" class="button ghost small">🏪 ${locale.lang === "en" ? "Generate Register POP →" : "店頭決済POPを出力 →"}</a>
          </div>
        </div>
      </section>

      <section class="declaration">
        <span>PARTICIPATE / EXIT</span>
        <h2>${locale.ui.declarationTitle}</h2>
        <p>${locale.ui.declarationDesc}</p>
        <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
          <a class="button primary" href="${prefix}/articles/cosmic-citizen-declaration">${locale.ui.readDeclaration}</a>
          <a class="button" style="background: #5865F2; color: #fff; border: 1px solid #5865F2; font-weight: bold;" href="${site.discordUrl}" target="_blank" rel="noopener noreferrer">💬 ${locale.ui.joinParliament}</a>
        </div>
      </section>`,
  });
}

function articlePage(article, rendered, locale) {
  const prefix = getPrefix(locale.lang);
  const displayTitle = locale.lang === "en" ? article.displayTitleEn : article.displayTitle;
  const summary = locale.lang === "en" ? article.summaryEn : article.summary;
  const label = locale.lang === "en" ? article.labelEn : article.label;
  const readStr = locale.lang === "en" ? article.readEn : article.read;

  const toc = rendered.toc.map(({ id, text }) => `<a href="#${id}">${escapeHtml(text)}</a>`).join("");
  const canonical = `${site.baseUrl}${prefix}/articles/${article.slug}`;
  const jaCanonical = `${site.baseUrl}/articles/${article.slug}`;
  const enCanonical = `${site.baseUrl}/en/articles/${article.slug}`;
  const ogImageUrl = article.ogImage ? `${site.baseUrl}/assets/${article.ogImage}` : `${site.baseUrl}${site.ogImageDefault}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonical
    },
    "headline": displayTitle ?? rendered.title,
    "description": summary,
    "image": [ogImageUrl],
    "datePublished": `${article.date}T00:00:00+09:00`,
    "dateModified": `${article.date}T00:00:00+09:00`,
    "inLanguage": locale.lang,
    "author": {
      "@type": "Organization",
      "name": site.author,
      "url": site.baseUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": site.name,
      "url": site.baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${site.baseUrl}${site.ogImageDefault}`
      }
    }
  };

  return shell({
    title: `${displayTitle ?? rendered.title} — ${site.name}`,
    description: summary,
    active: "articles",
    bodyClass: `article-page accent-${article.accent}`,
    canonical,
    jaCanonical,
    enCanonical,
    ogImage: ogImageUrl,
    locale,
    jsonLd,
    content: `
      <article class="article-shell">
        <header class="article-hero">
          <a class="back-link" href="${prefix}/#articles">${locale.ui.backToArticles}</a>
          <div class="article-meta"><span>${label}</span><time datetime="${article.date}">${formatDate(article.date, locale.lang)}</time><span>${readStr}</span></div>
          <h1>${inline(displayTitle ?? rendered.title)}</h1>
          <p>${escapeHtml(summary)}</p>
        </header>
        <div class="article-layout">
          <aside class="article-toc"><span>${locale.ui.toc}</span>${toc || `<a href="#article-body">${locale.ui.body}</a>`}</aside>
          <div class="prose" id="article-body">${rendered.html}</div>
        </div>
        <footer class="article-end">
          <span>${locale.ui.end}</span>
          <h2>UNIVGOV</h2>
          <a href="${prefix}/#articles">${locale.ui.readMore}</a>
        </footer>
      </article>`,
  });
}

function portalPage(locale) {
  const prefix = getPrefix(locale.lang);
  const isEn = locale.lang === "en";
  const canonical = `${site.baseUrl}${prefix}/portal`;
  const jaCanonical = `${site.baseUrl}/portal`;
  const enCanonical = `${site.baseUrl}/en/portal`;

  const content = `
    <div class="portal-wrapper">
      <div class="portal-container">
        
        <!-- Header -->
        <header class="portal-header">
          <div class="portal-badge">
            <span class="portal-badge-dot"></span>
            ${isEn ? "UNIVGOV DIGITAL CITIZEN PORTAL" : "宇宙政府 統合デジタル市民ポータル"}
          </div>
          <h1 class="portal-title">${isEn ? "My Cosmic Portal" : "宇宙国民マイポータル"}</h1>
          <p class="portal-subtitle">${isEn ? "Manage your Cosmic Citizen identity, credentials, and digital modular rights." : "あなたの宇宙国民ID、登録情報、モジュール型行政・認証サービスの統合管理画面です。"}</p>
        </header>

        <!-- Unauthenticated View (Login / Register) -->
        <div id="portal-unauth-view" class="portal-card-box" style="max-width: 520px; margin: 0 auto; text-align: center; padding: 40px 24px;">
          <div class="portal-login-header">
            <div style="font-size: 2.6rem; margin-bottom: 12px;">🔑</div>
            <h2>${isEn ? "Citizen Authentication / Login" : "宇宙国民 ログイン・認証"}</h2>
            <p style="color: #94a3b8; font-size: 0.92rem; margin: 8px 0 24px 0; line-height: 1.6;">
              ${isEn ? "Sign in using your Google account to access your Citizen Portal and manage your modular identity." : "Googleアカウントでログインすると、即座にマイポータルが開き、国民証の確認や各種設定を利用できます。"}
            </p>
          </div>

          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; margin: 20px 0;">
            <div id="g_id_onload_portal"
                 data-client_id="${site.googleClientId}"
                 data-context="signin"
                 data-ux_mode="popup"
                 data-callback="handleGoogleLoginResponse"
                 data-auto_prompt="true">
            </div>

            <div id="g_id_signin_portal" class="g_id_signin"
                 data-type="standard"
                 data-shape="pill"
                 data-theme="filled_blue"
                 data-text="signin_with"
                 data-size="large"
                 data-logo_alignment="left"
                 data-width="280">
            </div>

            <!-- Fallback / Direct Trigger Button -->
            <button type="button" id="btn-portal-google-login" class="button primary" style="display: inline-flex; align-items: center; justify-content: center; gap: 10px; font-weight: 700; font-size: 1rem; padding: 12px 28px; width: 100%; max-width: 320px; background: #2563eb; border-color: #3b82f6;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>${isEn ? "Sign in with Google" : "Googleでサインイン"}</span>
            </button>
          </div>

          <div id="login-feedback-msg" class="portal-alert" hidden style="margin-top: 16px;"></div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 0.8rem; color: #64748b; line-height: 1.5;">
            🔒 ${isEn ? "Complete Exit Rights: You can permanently erase all citizen records and exit at any time from My Portal." : "完全な退出権（EXIT）の保証：いかなる囲い込みもなく、マイポータルからいつでも登録データを完全消去して脱退できます。"}
          </div>
        </div>

        <!-- Authenticated View (My Portal) -->
        <div id="portal-auth-view" hidden>
          
          <!-- Citizen Overview Banner -->
          <div class="portal-overview-card">
            <div class="overview-avatar" id="portal-avatar">
              <span id="portal-avatar-char">U</span>
            </div>
            <div class="overview-info">
              <div class="overview-top">
                <span class="citizen-badge verified">
                  <span class="badge-dot"></span> ${isEn ? "VERIFIED CITIZEN" : "宇宙国民（認証済）"}
                </span>
                <span class="citizen-id-tag" id="portal-citizen-id">UNIV-2026-00000</span>
              </div>
              <h2 class="overview-name" id="portal-user-name">---</h2>
              <p class="overview-email" id="portal-user-email">---</p>
              <div class="overview-meta">
                <span>${isEn ? "Registration Date: " : "発行・登録日: "}<strong id="portal-reg-date">----.--.--</strong></span>
                <span>${isEn ? "Status: " : "ステータス: "}<strong id="portal-status" style="color: #10b981;">Active</strong></span>
                <span>${isEn ? "UNI Vault: " : "宇宙通貨残高: "}<strong id="portal-header-uni" style="color: #38bdf8;">1,000,000 UNI</strong></span>
              </div>
            </div>
            <div class="overview-actions">
              <button type="button" class="button ghost small" id="btn-logout">${isEn ? "Sign Out" : "ログアウト"}</button>
            </div>
          </div>

          <!-- Main Dashboard Grid -->
          <div class="portal-grid">
            
            <!-- Left: Citizen Card Presentation -->
            <div class="portal-column-left">
              <div class="portal-card-box">
                <div class="section-title-wrap">
                  <h3>${isEn ? "Digital Citizen Certificate" : "デジタル宇宙国民証"}</h3>
                  <small>${isEn ? "Official Modular Identity" : "自己決定型デジタル身分証"}</small>
                </div>

                <div class="citizen-card official-card" id="digital-citizen-card">
                  <div class="citizen-card__header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <img src="/assets/univgov-logo.jpg" alt="" width="32" height="32">
                      <div>
                        <strong style="font-size: 0.9rem; color: #fff; letter-spacing: 0.08em; display: block;">UNIVGOV</strong>
                        <span style="font-size: 0.65rem; color: #94a3b8; letter-spacing: 0.05em;">COSMIC CITIZEN CARD</span>
                      </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span id="card-btc-badge" class="card-btc-badge" hidden>⚡ SATS EARNER</span>
                      <span class="card-chip"></span>
                    </div>
                  </div>

                  <div class="citizen-card__body">
                    <div class="citizen-card__row">
                      <span class="citizen-card__label">NAME</span>
                      <strong class="citizen-card__value" id="card-display-name">---</strong>
                    </div>
                    <div class="citizen-card__row">
                      <span class="citizen-card__label">CITIZEN ID (ACCOUNT)</span>
                      <span class="citizen-card__value" id="card-display-id" style="font-size: 0.88rem; font-family: monospace; color: #38bdf8;">---</span>
                    </div>
                    <div class="citizen-card__row uni-balance-row">
                      <span class="citizen-card__label">COSMIC CURRENCY (UNI)</span>
                      <strong class="citizen-card__value" id="card-display-uni" style="font-size: 0.95rem; color: #38bdf8; font-family: monospace;">1,000,000 UNI</strong>
                    </div>
                    <div class="citizen-card__row" id="card-ln-row" hidden>
                      <span class="citizen-card__label">LIGHTNING / BTC RECEIVER</span>
                      <span class="citizen-card__value" id="card-display-ln" style="font-size: 0.82rem; font-family: monospace; color: #f59e0b; word-break: break-all;">---</span>
                    </div>
                    <div class="citizen-card__row">
                      <span class="citizen-card__label">ISSUED DATE</span>
                      <span class="citizen-card__value" id="card-display-date">----.--.--</span>
                    </div>
                  </div>

                  <div class="citizen-card__footer">
                    <div>
                      <span class="citizen-card__label">STATUS</span>
                      <span style="font-size: 0.85rem; color: #10b981; font-weight: bold;">● VERIFIED</span>
                    </div>
                    <div class="card-qr-box" id="card-qr-container">
                      <img src="/assets/univgov-qr.svg" alt="Verify QR" width="48" height="48" id="card-qr-img">
                    </div>
                  </div>
                </div>

                <div class="card-action-bar">
                  <button type="button" class="button secondary small" id="btn-print-card">🖨️ ${isEn ? "Print ID Card" : "国民証を印刷 / PDF"}</button>
                  <button type="button" class="button primary small" id="btn-print-salary-form" style="background: #f59e0b; border-color: #f59e0b; color: #000; font-weight: bold;">📄 ${isEn ? "Salary BTC Request PDF" : "給与BTC受取 申請書を出力"}</button>
                  <button type="button" class="button ghost small" id="btn-print-store-pop">🏪 ${isEn ? "Store BTC POP Stand" : "店舗用BTC決済POP出力"}</button>
                </div>
              </div>

              <!-- Supermarket & Daily BTC Practical Guide -->
              <div class="portal-card-box btc-guide-box">
                <div class="section-title-wrap">
                  <h3 style="color: #f59e0b;">🛒 ${isEn ? "Supermarket & Daily Living BTC Practical Guide" : "スーパー・日常店舗でのBitcoin活用ナビ"}</h3>
                  <small>${isEn ? "How to spend BTC for groceries and daily living" : "今すぐスーパーやコンビニでBTCを使う3大ルート"}</small>
                </div>

                <div class="btc-use-route-list">
                  <div class="btc-route-card">
                    <div class="route-badge">ルート 1: 最強・全国スーパー完全対応</div>
                    <h4>💳 Visa / Mastercard プリペイドチャージ型</h4>
                    <p>Bitcoin（オンチェーン/Lightning）から即時チャージし、イオン・西友・ライフ・業務スーパー・コンビニ等でVisa/QUICPay/タッチ決済として1秒で支払う方法。</p>
                    <small style="color: #38bdf8;">推奨カード例: Slash Card / Wirex / Bybit Card 等</small>
                  </div>

                  <div class="btc-route-card">
                    <div class="route-badge">ルート 2: 金券・ギフト券即時変換</div>
                    <h4>🎁 デジタルギフト券ルート (Bitrefill等)</h4>
                    <p>Lightningで即時購入。Apple Gift、Amazonギフト券、クオカードPay等に交換し、スーパーや日用品の買い物に充当。</p>
                  </div>

                  <div class="btc-route-card">
                    <div class="route-badge">ルート 3: 直接決済 & 店舗導入</div>
                    <h4>⚡ Lightning / オンチェーン直接決済</h4>
                    <p>ビックカメラ・コジマ等や全国の対応店舗・宇宙国民提携店でスマホウォレットから直接QRスキャン決済。</p>
                  </div>
                </div>
              </div>

            </div>

            <!-- Right: Portal Management Features (UNI Vault, Settings, Menu) -->
            <div class="portal-column-right">
              
              <!-- Cosmic Currency UNI Vault & P2P Transfer Module -->
              <div class="portal-card-box uni-vault-card" style="border: 1px solid rgba(56, 189, 248, 0.35); background: linear-gradient(145deg, rgba(56, 189, 248, 0.06) 0%, rgba(15, 23, 42, 0.95) 100%);">
                <div class="section-title-wrap" style="border-bottom-color: rgba(56, 189, 248, 0.15);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                    <div>
                      <h3 style="color: #38bdf8; display: flex; align-items: center; gap: 6px;">
                        <span>🪐</span> ${isEn ? "Cosmic Currency UNI Vault" : "宇宙通貨 UNI ウォレット"}
                      </h3>
                      <small>${isEn ? "Non-territorial sovereign currency & instant P2P settlement" : "非領土型ネイティブ価値単位・P2P直接送金・受取台帳"}</small>
                    </div>
                    <span class="uni-scale-badge" style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-size: 0.72rem; padding: 3px 8px; border-radius: 12px; font-weight: 600;">
                      ${isEn ? "≈ 1 JPY Scale (Floating)" : "約1円スケール（変動相場制）"}
                    </span>
                  </div>
                </div>

                <!-- Big Balance Banner -->
                <div class="vault-balance-banner" style="background: rgba(7, 10, 17, 0.8); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
                  <div style="font-size: 0.8rem; color: #8b9bb4; letter-spacing: 0.05em; margin-bottom: 6px;">
                    ${isEn ? "CURRENT AVAILABLE UNI BALANCE" : "現在の保有残高（宇宙基本給＋取引残高）"}
                  </div>
                  <div style="font-size: clamp(2.2rem, 4vw, 3rem); font-weight: 800; color: #38bdf8; font-family: monospace; letter-spacing: -0.5px; text-shadow: 0 0 20px rgba(56, 189, 248, 0.3);">
                    <span id="vault-uni-balance">1,000,000</span> <span style="font-size: 1.2rem; font-weight: 600; color: #94a3b8;">UNI</span>
                  </div>
                  <div style="font-size: 0.8rem; color: #64748b; margin-top: 6px;">
                    ${isEn 
                      ? "🎉 1,000,000 UNI (10⁶ UNI) initial grant deposited upon citizenship issuance." 
                      : "🎉 宇宙国民証発行に伴い、初期基本給 1,000,000 UNI（10⁶ UNI）が付与されています。"}
                  </div>
                </div>

                <!-- Vault 2-Column Actions (Transfer / Receive) -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 20px;">
                  
                  <!-- P2P Transfer Box -->
                  <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 16px;">
                    <h4 style="margin: 0 0 12px 0; color: #fff; font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
                      <span>⚡</span> ${isEn ? "P2P Instant Transfer" : "P2P 即時送金"}
                    </h4>
                    <form id="uni-transfer-form" class="portal-form">
                      <div class="form-group" style="margin-bottom: 10px;">
                        <label for="uni-send-to" style="font-size: 0.78rem;">${isEn ? "Recipient Citizen ID / Email" : "送金先（国民IDまたはメール）"}</label>
                        <input type="text" id="uni-send-to" name="to" required placeholder="e.g. friend@example.com" style="font-size: 0.88rem; padding: 8px 10px;">
                      </div>
                      <div class="form-group" style="margin-bottom: 10px;">
                        <label for="uni-send-amount" style="font-size: 0.78rem;">${isEn ? "Amount (UNI)" : "送金額 (UNI)"}</label>
                        <input type="number" id="uni-send-amount" name="amount" required min="1" placeholder="e.g. 5000" style="font-size: 0.88rem; padding: 8px 10px;">
                      </div>
                      <div class="form-group" style="margin-bottom: 12px;">
                        <label for="uni-send-memo" style="font-size: 0.78rem;">${isEn ? "Memo / Note (Optional)" : "用途・メモ（任意）"}</label>
                        <input type="text" id="uni-send-memo" name="memo" placeholder="${isEn ? 'e.g. Coffee / Project bounty' : '例: カフェ代 / 共同作業の報酬'}" maxlength="60" style="font-size: 0.88rem; padding: 8px 10px;">
                      </div>
                      <button type="submit" class="button primary small full-width" id="btn-send-uni" style="background: #0284c7; border-color: #38bdf8; font-weight: 700;">
                        🚀 ${isEn ? "Send UNI Instantly" : "UNI を送金する"}
                      </button>
                      <div id="transfer-feedback-msg" class="portal-alert" hidden style="margin-top: 10px;"></div>
                    </form>
                  </div>

                  <!-- Receive / QR Box -->
                  <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 16px; display: flex; flex-direction: column;">
                    <h4 style="margin: 0 0 8px 0; color: #fff; font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
                      <span>📥</span> ${isEn ? "Receive UNI Payment" : "UNI 受取用アドレス"}
                    </h4>
                    <p style="font-size: 0.78rem; color: #8b9bb4; margin: 0 0 10px 0; line-height: 1.5;">
                      ${isEn ? "Give your Citizen ID or QR to any citizen to receive instant UNI transfers." : "他の国民にあなたの国民IDまたはQRを共有することで、いつでも直接UNIの送金を受取可能です。"}
                    </p>
                    <div style="text-align: center; margin: auto 0;">
                      <img id="uni-receive-qr" src="/assets/univgov-qr.svg" width="120" height="120" alt="UNI Receive QR" style="background: #fff; padding: 5px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                    </div>
                    <div style="display: flex; gap: 6px; margin-top: 12px;">
                      <input type="text" id="uni-receive-id-val" readonly style="font-family: monospace; font-size: 0.78rem; color: #38bdf8; background: #070a11; border: 1px solid #1e293b; padding: 6px 8px; border-radius: 6px; flex: 1;">
                      <button type="button" class="button ghost small" id="btn-copy-uni-id" style="padding: 6px 10px; font-size: 0.75rem; white-space: nowrap;">📋 ${isEn ? "Copy" : "コピー"}</button>
                    </div>
                  </div>
                </div>

                <!-- Transaction Ledger Box -->
                <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h4 style="margin: 0; font-size: 0.9rem; color: #fff; display: flex; align-items: center; gap: 6px;">
                      <span>📜</span> ${isEn ? "Recent UNI Ledger / History" : "UNI 取引履歴・台帳"}
                    </h4>
                    <button type="button" id="btn-refresh-txs" class="button ghost small" style="padding: 3px 8px; font-size: 0.72rem;">🔄 ${isEn ? "Refresh" : "更新"}</button>
                  </div>
                  <div id="uni-tx-list-container" style="max-height: 220px; overflow-y: auto; background: rgba(7, 10, 17, 0.6); border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 8px; padding: 8px;">
                    <div style="text-align: center; color: #8b9bb4; font-size: 0.82rem; padding: 16px;">${isEn ? "Loading ledger..." : "取引台帳を読み込み中..."}</div>
                  </div>
                </div>
              </div>
              
              <!-- Profile & Bitcoin Address Update -->
              <div class="portal-card-box">
                <div class="section-title-wrap">
                  <h3>${isEn ? "Citizen Profile & Bitcoin Receiver Settings" : "登録情報 & Bitcoin受取先の設定"}</h3>
                  <small>${isEn ? "Set your Lightning address and salary preference" : "氏名、Lightningアドレス、給与受取比率の設定"}</small>
                </div>
                <form id="portal-update-form" class="portal-form">
                  <div class="form-group">
                    <label for="portal-edit-name">${isEn ? "Identifier / Full Name" : "識別名（氏名・エイリアス）"}</label>
                    <input type="text" id="portal-edit-name" name="name" required maxlength="40">
                  </div>

                  <div class="form-group">
                    <label for="portal-edit-ln">⚡ ${isEn ? "Lightning Address (LNURL)" : "Lightning Address（ライトニング受取先）"}</label>
                    <input type="text" id="portal-edit-ln" name="lnAddress" placeholder="e.g. you@walletofsatoshi.com or user@strike.me" maxlength="100">
                    <small style="color: #8b9bb4; font-size: 0.78rem; display: block; margin-top: 4px;">※設定すると国民証に送金受取QRコードおよびホログラムバッジが付与されます。</small>
                  </div>

                  <div class="form-group">
                    <label for="portal-edit-btc">₿ ${isEn ? "On-Chain Bitcoin Address" : "オンチェーン Bitcoin アドレス (任意)"}</label>
                    <input type="text" id="portal-edit-btc" name="btcAddress" placeholder="e.g. bc1q..." maxlength="100">
                  </div>

                  <div class="form-group">
                    <label for="portal-edit-salary-rate">💰 ${isEn ? "Target BTC Salary Ratio (%)" : "希望する給与・報酬のBTC受取比率"}</label>
                    <select id="portal-edit-salary-rate" name="btcSalaryRate" style="width: 100%; padding: 12px 14px; background: #0b0f19; border: 1px solid #334155; border-radius: 8px; color: #fff; font-size: 0.95rem;">
                      <option value="0">0% (日本円のみ)</option>
                      <option value="10">10% (少額積立・実験)</option>
                      <option value="20">20% (積極的脱出)</option>
                      <option value="50">50% (生活防衛・半分BTC)</option>
                      <option value="100">100% (完全国家EXIT)</option>
                    </select>
                  </div>

                  <div class="form-actions-right">
                    <button type="submit" class="button primary small" id="btn-update-name">${isEn ? "Save Settings" : "設定を保存する"}</button>
                  </div>
                  <div id="update-feedback-msg" class="portal-alert" hidden></div>
                </form>
              </div>

              <!-- Modular Services & Records -->
              <div class="portal-card-box">
                <div class="section-title-wrap">
                  <h3>${isEn ? "Modular Services & Protocols" : "行政モジュール & 手続きメニュー"}</h3>
                  <small>${isEn ? "Integrated Civic Modules" : "利用可能な機能一覧"}</small>
                </div>
                
                <div class="portal-menu-grid">
                  <div class="portal-menu-item">
                    <div class="menu-icon">🏛️</div>
                    <div class="menu-text">
                      <strong>${isEn ? "Cosmic Parliament (Discord)" : "宇宙議会（公式Discordコミュニティ）"}</strong>
                      <p>${isEn ? "Participate in policy debates, voting, and civic discussions" : "政策議論・意思決定・市民交流・議事録の閲覧"}</p>
                    </div>
                    <a href="${site.discordUrl}" target="_blank" rel="noopener noreferrer" class="menu-link" style="background: rgba(88, 101, 242, 0.15); border-color: rgba(88, 101, 242, 0.3); color: #818cf8;">${isEn ? "Join Discord" : "議会に参加"} ↗</a>
                  </div>

                  <div class="portal-menu-item">
                    <div class="menu-icon">𝕏</div>
                    <div class="menu-text">
                      <strong>${isEn ? "X Public Deliberation (#UNIVGOV)" : "X 公開議会での発言・法案提起"}</strong>
                      <p>${isEn ? "Submit bills or arguments with your verified Citizen ID" : "市民ID付きで法案提案・意見をXへワンクリック投稿"}</p>
                    </div>
                    <a id="btn-portal-x-post" href="https://x.com/intent/post?text=${encodeURIComponent('【宇宙政府 議会発言】\n\n#UNIVGOV #UNIVGOV_BILL\nhttps://univgov.pages.dev')}" target="_blank" rel="noopener noreferrer" class="menu-link" style="background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); color: #fff;">${isEn ? "Post on X" : "Xで発言"} ↗</a>
                  </div>

                  <div class="portal-menu-item">
                    <div class="menu-icon">📜</div>
                    <div class="menu-text">
                      <strong>${isEn ? "Citizen Declaration" : "宇宙国民宣言・署名台帳"}</strong>
                      <p>${isEn ? "Status: Signed upon account creation" : "ステータス: 署名済（アカウント発行時合意）"}</p>
                    </div>
                    <a href="${prefix}/articles/cosmic-citizen-declaration" class="menu-link">${isEn ? "View" : "確認"} →</a>
                  </div>

                  <div class="portal-menu-item">
                    <div class="menu-icon">🛡️</div>
                    <div class="menu-text">
                      <strong>${isEn ? "Universal Space Law v1" : "宇宙基本法 適用規約"}</strong>
                      <p>${isEn ? "Non-territorial governance rights" : "非領域型統治・モジュール選択権の行使"}</p>
                    </div>
                    <a href="${prefix}/articles/space-law-v1" class="menu-link">${isEn ? "View" : "確認"} →</a>
                  </div>

                  <div class="portal-menu-item">
                    <div class="menu-icon">📦</div>
                    <div class="menu-text">
                      <strong>${isEn ? "Data Portability & Export" : "個人データのエクスポート"}</strong>
                      <p>${isEn ? "Download your complete registration JSON" : "自身の登録全データのJSONダウンロード"}</p>
                    </div>
                    <button type="button" class="menu-btn" id="btn-export-data">${isEn ? "Export" : "出力"}</button>
                  </div>
                </div>
              </div>

              <!-- Exit Protocol / Account Termination -->
              <div class="portal-card-box danger-zone">
                <div class="section-title-wrap">
                  <h3 style="color: #ef4444;">${isEn ? "Exit Protocol (Account Termination)" : "退出プロトコル（アカウント削除・脱退）"}</h3>
                  <small>${isEn ? "Cosmic Principle: Complete Exit Rights" : "七原則第6条：自由な参加と完全なEXITの保障"}</small>
                </div>
                <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 12px;">
                  ${isEn ? "In accordance with UNIVGOV principles, you may delete your citizen record and session data at any time without restriction." : "宇宙政府の原則に基づき、いかなる制約もなくいつでも自身の登録データを完全に抹消して脱退できます。"}
                </p>
                <button type="button" class="button danger small" id="btn-delete-account">${isEn ? "Execute Exit Protocol (Delete Data)" : "退出プロトコルを実行（データを完全削除）"}</button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- Hidden Print Templates for PDF Generation -->
    <div id="print-salary-template" class="print-sheet" style="display: none;">
      <div class="sheet-header">
        <h2>給与・報酬の暗号資産（Bitcoin）振込に関する申出兼同意書</h2>
        <p style="text-align: right; font-size: 12px;">発行元：宇宙政府 統合ポータル (UNIVGOV)</p>
      </div>
      <p>貴社代表者殿</p>
      <p style="margin: 15px 0;">私は、労働基準法第24条第1項および関係法令・労使協定の定めに従い、下記のとおり給与・報酬の一部または全部について、Bitcoin（暗号資産）による送金・口座振込を希望し、これに同意いたします。</p>
      
      <table class="sheet-table" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><th style="border: 1px solid #000; padding: 8px; width: 30%;">申請者氏名</th><td style="border: 1px solid #000; padding: 8px;" id="sheet-salary-name"></td></tr>
        <tr><th style="border: 1px solid #000; padding: 8px;">宇宙国民ID (アカウント)</th><td style="border: 1px solid #000; padding: 8px;" id="sheet-salary-id"></td></tr>
        <tr><th style="border: 1px solid #000; padding: 8px;">希望振込比率</th><td style="border: 1px solid #000; padding: 8px;" id="sheet-salary-rate"></td></tr>
        <tr><th style="border: 1px solid #000; padding: 8px;">受取先 Lightning Address</th><td style="border: 1px solid #000; padding: 8px; font-family: monospace;" id="sheet-salary-ln"></td></tr>
        <tr><th style="border: 1px solid #000; padding: 8px;">受取先 BTC アドレス</th><td style="border: 1px solid #000; padding: 8px; font-family: monospace;" id="sheet-salary-btc"></td></tr>
      </table>

      <div style="font-size: 11px; line-height: 1.6; color: #333; margin-top: 20px;">
        <p><strong>【法的根拠および留意事項】</strong></p>
        <p>1. 本申出は、労働基準法第24条第1項ただし書及び労使協定・労働者の自由意思に基づく同意に基づいて運用されます。<br>
        2. 換金性の確保：指定の暗号資産アドレスは本人が管理し、いつでも法定通貨へ換金可能な状態にあることを確認しています。<br>
        3. 源泉徴収および社会保険料等の法定控除は、振込時点の法定通貨換算額に基づき従前どおり適切に処理されます。</p>
      </div>

      <div style="margin-top: 40px; text-align: right;">
        <p>申出日： <span id="sheet-salary-date"></span></p>
        <p style="margin-top: 20px;">本人署名・捺印： ___________________________ 印</p>
      </div>
    </div>

    <!-- Hidden Store POP Stand Template -->
    <div id="print-store-pop-template" class="print-sheet" style="display: none;">
      <div style="border: 3px solid #f59e0b; padding: 30px; text-align: center; border-radius: 12px; max-width: 500px; margin: 0 auto;">
        <h1 style="color: #f59e0b; margin: 0 0 10px 0; font-size: 26px;">⚡ BITCOIN / LIGHTNING 決済歓迎 ⚡</h1>
        <p style="font-size: 16px; margin: 0 0 20px 0; font-weight: bold;">当店は宇宙国民（UNIVGOV）＆ビットコイン決済に対応しています</p>
        <div style="margin: 20px auto; padding: 15px; background: #fff; display: inline-block; border-radius: 8px;">
          <img id="pop-qr-img" src="/assets/univgov-qr.svg" width="180" height="180" alt="Payment QR">
        </div>
        <p style="font-family: monospace; font-size: 15px; margin: 10px 0 5px 0; color: #000; font-weight: bold;" id="pop-ln-display"></p>
        <p style="font-size: 12px; color: #666; margin: 0;">スマホウォレットでQRコードをスキャンして即時送金できます</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px dashed #ccc;">
        <p style="font-size: 11px; color: #888; margin: 0;">UNIVGOV — Non-territorial Modular Economy Protocol</p>
      </div>
    </div>
  `;

  return shell({
    title: `${isEn ? "Cosmic Citizen Portal" : "宇宙国民マイポータル"} — ${site.name}`,
    description: isEn ? "Official digital citizen portal for UNIVGOV citizens." : "宇宙国民のためのデジタルID・登録情報管理ポータル画面です。",
    active: "portal",
    bodyClass: "portal-page",
    canonical,
    jaCanonical,
    enCanonical,
    locale,
    content,
  });
}

function adminPage() {
  const locale = i18n.ja;
  return shell({
    title: `宇宙政府 統合アナリティクス＆国民台帳 (Admin) — ${site.name}`,
    description: "Google Analytics風のリアルタイム訪問人数・滞在時間・流入元・国民登録ダッシュボード",
    locale,
    bodyClass: "admin-page",
    content: `
      <style>
        .admin-dashboard { max-width: 1200px; margin: 30px auto; padding: 0 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .admin-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; }
        .admin-header-title { font-size: 1.8rem; margin: 5px 0 0 0; color: #fff; }
        .admin-header-sub { color: #8b9bb4; font-size: 0.9rem; margin: 5px 0 0 0; }
        .admin-live-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(0, 210, 211, 0.15); color: #00d2d3; border-radius: 20px; font-size: 0.75rem; font-weight: bold; border: 1px solid rgba(0, 210, 211, 0.3); }
        .admin-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #00d2d3; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.4; } }
        
        .admin-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .admin-kpi-card { background: rgba(18, 24, 32, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); position: relative; overflow: hidden; }
        .admin-kpi-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--card-accent, #00d2d3); }
        .admin-kpi-card.accent-cyan { --card-accent: #00d2d3; }
        .admin-kpi-card.accent-orange { --card-accent: #ff9f43; }
        .admin-kpi-card.accent-violet { --card-accent: #a29bfe; }
        .admin-kpi-card.accent-green { --card-accent: #1dd1a1; }
        .admin-kpi-label { font-size: 0.85rem; color: #8b9bb4; font-weight: 500; display: flex; align-items: center; gap: 6px; }
        .admin-kpi-val { font-size: 2.2rem; font-weight: 800; color: #fff; margin: 8px 0 4px 0; letter-spacing: -0.5px; }
        .admin-kpi-sub { font-size: 0.8rem; color: #5f748d; }
        
        .admin-realtime-banner { background: linear-gradient(90deg, rgba(0,210,211,0.1) 0%, rgba(18,24,32,0.8) 100%); border: 1px solid rgba(0,210,211,0.25); border-radius: 10px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .admin-realtime-text { font-size: 0.95rem; color: #fff; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        
        .admin-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        @media (max-width: 860px) { .admin-grid-2 { grid-template-columns: 1fr; } }
        
        .admin-section-box { background: rgba(18, 24, 32, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 22px; }
        .admin-section-head { font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
        .admin-section-head small { font-size: 0.8rem; color: #8b9bb4; font-weight: normal; }
        
        .source-bar-item { margin-bottom: 12px; }
        .source-bar-info { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px; color: #e2e8f0; }
        .source-bar-track { background: rgba(255,255,255,0.06); height: 8px; border-radius: 4px; overflow: hidden; }
        .source-bar-fill { height: 100%; background: #ff9f43; border-radius: 4px; transition: width 0.6s ease; }
        
        .admin-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem; }
        .admin-table th { padding: 10px 12px; color: #8b9bb4; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 0.8rem; text-transform: uppercase; }
        .admin-table td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #cbd5e1; }
        .admin-table tr:hover td { background: rgba(255,255,255,0.02); }
        .live-stream-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.85rem; }
        .live-stream-path { color: #00d2d3; font-weight: 500; font-family: monospace; }
        .live-stream-meta { color: #8b9bb4; font-size: 0.78rem; text-align: right; }
      </style>

      <div class="admin-dashboard">
        <header class="admin-header">
          <div>
            <div class="admin-live-badge"><span class="admin-live-dot"></span> リアルタイム常時記録中</div>
            <h1 class="admin-header-title">宇宙政府 統合アナリティクス</h1>
            <p class="admin-header-sub">訪問人数・滞在時間（読了秒数）・流入元・国民登録のリアルタイム統計</p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button id="adm-refresh" class="button primary" style="font-size: 0.85rem; padding: 8px 16px;">今すぐ更新</button>
            <button id="adm-export" class="button ghost" style="font-size: 0.85rem; padding: 8px 16px;">台帳CSV出力</button>
          </div>
        </header>

        <!-- 4 Big GA KPI Cards -->
        <div class="admin-kpi-grid">
          <div class="admin-kpi-card accent-cyan">
            <div class="admin-kpi-label">👥 本日の訪問者数（生身の人数）</div>
            <div class="admin-kpi-val" id="val-today-visitors">0 <span style="font-size: 1rem; font-weight: normal; color: #8b9bb4;">人</span></div>
            <div class="admin-kpi-sub">累計訪問者: <strong id="val-total-visitors" style="color: #cbd5e1;">0</strong> 人</div>
          </div>

          <div class="admin-kpi-card accent-orange">
            <div class="admin-kpi-label">⏱️ 本日の平均滞在時間</div>
            <div class="admin-kpi-val" id="val-today-duration">0秒</div>
            <div class="admin-kpi-sub">全期間平均: <strong id="val-total-duration" style="color: #cbd5e1;">0秒</strong></div>
          </div>

          <div class="admin-kpi-card accent-violet">
            <div class="admin-kpi-label">📄 本日の総ページビュー (PV)</div>
            <div class="admin-kpi-val" id="val-today-pvs">0 <span style="font-size: 1rem; font-weight: normal; color: #8b9bb4;">回</span></div>
            <div class="admin-kpi-sub">累計PV: <strong id="val-total-pvs" style="color: #cbd5e1;">0</strong> 回</div>
          </div>

          <div class="admin-kpi-card accent-green">
            <div class="admin-kpi-label">🚀 宇宙国民登録数 ＆ 登録率</div>
            <div class="admin-kpi-val" id="val-citizens-count">0 <span style="font-size: 1rem; font-weight: normal; color: #8b9bb4;">名</span></div>
            <div class="admin-kpi-sub">本日登録: <strong id="val-today-citizens" style="color: #1dd1a1;">0</strong> 名 / CVR: <strong id="val-cvr" style="color: #cbd5e1;">0.0%</strong></div>
          </div>
        </div>

        <!-- Realtime Active Banner -->
        <div class="admin-realtime-banner">
          <div class="admin-realtime-text">
            <span class="admin-live-dot"></span>
            現在サイトを閲覧中のアクティブ人数（直近5分）：<strong id="val-active-now" style="font-size: 1.3rem; color: #00d2d3; margin-left: 4px;">0</strong> 名
          </div>
          <div style="font-size: 0.8rem; color: #8b9bb4;">
            次回自動更新まで: <span id="adm-timer">10</span> 秒
          </div>
        </div>

        <!-- Grid: Sources & Top Content -->
        <div class="admin-grid-2">
          <!-- Referrers -->
          <div class="admin-section-box">
            <div class="admin-section-head">
              <span>🌐 どこから来たか（流入元）</span>
              <small>直近7日間</small>
            </div>
            <div id="referrers-container">
              <p style="color: #8b9bb4; font-size: 0.9rem;">集計中...</p>
            </div>
          </div>

          <!-- Top Articles -->
          <div class="admin-section-box">
            <div class="admin-section-head">
              <span>📖 人気のページ・記事ランキング</span>
              <small>直近7日間</small>
            </div>
            <div style="overflow-x: auto;">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ページ</th>
                    <th>閲覧数</th>
                    <th>平均滞在</th>
                  </tr>
                </thead>
                <tbody id="top-pages-body">
                  <tr><td colspan="3" style="text-align: center; color: #8b9bb4;">読み込み中...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Grid: Live Stream & Registration Log -->
        <div class="admin-grid-2">
          <!-- Live Activity Stream -->
          <div class="admin-section-box">
            <div class="admin-section-head">
              <span>⚡ 直近のアクセス実況</span>
              <small>最新15件</small>
            </div>
            <div id="live-stream-container">
              <p style="color: #8b9bb4; font-size: 0.9rem;">読み込み中...</p>
            </div>
          </div>

          <!-- Citizens Registry Table -->
          <div class="admin-section-box">
            <div class="admin-section-head">
              <span>📜 宇宙国民 登録申請台帳</span>
              <small>最新20件</small>
            </div>
            <div style="overflow-x: auto;">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ID番号</th>
                    <th>識別名</th>
                    <th>登録日時</th>
                  </tr>
                </thead>
                <tbody id="citizens-body">
                  <tr><td colspan="3" style="text-align: center; color: #8b9bb4;">台帳を読み込み中...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <script>
        (function() {
          let timer = 10;
          let allCitizensData = [];

          function formatDuration(sec) {
            sec = Math.round(sec || 0);
            if (sec <= 0) return "0秒";
            if (sec < 60) return sec + "秒";
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return m + "分" + (s < 10 ? "0" : "") + s + "秒";
          }

          function formatPathName(p) {
            if (p === "/" || p === "") return "🏠 トップページ (JP)";
            if (p === "/en/" || p === "/en") return "🏠 Top Page (EN)";
            if (p === "/nomi" || p === "/nomi/") return "🍺 飲み会用ガイド (/nomi)";
            return p.replace("/articles/", "📄 ");
          }

          async function loadAnalytics() {
            try {
              const res = await fetch("/api/analytics");
              if (!res.ok) throw new Error("API error");
              const data = await res.json();
              const s = data.summary || {};

              // 1. KPI Cards
              document.getElementById("val-today-visitors").innerHTML = (s.todayVisitors || 0) + ' <span style="font-size: 1rem; font-weight: normal; color: #8b9bb4;">人</span>';
              document.getElementById("val-total-visitors").textContent = s.totalVisitors || 0;

              document.getElementById("val-today-duration").textContent = formatDuration(s.todayAvgDuration);
              document.getElementById("val-total-duration").textContent = formatDuration(s.totalAvgDuration);

              document.getElementById("val-today-pvs").innerHTML = (s.todayPageviews || 0) + ' <span style="font-size: 1rem; font-weight: normal; color: #8b9bb4;">回</span>';
              document.getElementById("val-total-pvs").textContent = s.totalPageviews || 0;

              document.getElementById("val-citizens-count").innerHTML = (s.totalCitizens || 0) + ' <span style="font-size: 1rem; font-weight: normal; color: #8b9bb4;">名</span>';
              document.getElementById("val-today-citizens").textContent = s.todayCitizens || 0;
              document.getElementById("val-cvr").textContent = s.cvr || "0.0%";

              document.getElementById("val-active-now").textContent = s.activeNow || 0;

              // 2. Referrers
              const refContainer = document.getElementById("referrers-container");
              const refs = data.topReferrers || [];
              const totalRefs = refs.reduce((acc, r) => acc + r.count, 0) || 1;
              if (refs.length === 0) {
                refContainer.innerHTML = '<p style="color: #8b9bb4; font-size: 0.85rem; padding: 20px 0; text-align: center;">まだ流入データがありません。</p>';
              } else {
                refContainer.innerHTML = refs.map(r => {
                  const pct = Math.round((r.count / totalRefs) * 100);
                  return '<div class="source-bar-item">' +
                    '<div class="source-bar-info"><span>' + r.referrer_source + '</span><strong>' + r.count + ' 回 (' + pct + '%)</strong></div>' +
                    '<div class="source-bar-track"><div class="source-bar-fill" style="width: ' + pct + '%;"></div></div>' +
                  '</div>';
                }).join("");
              }

              // 3. Top Pages
              const topPagesBody = document.getElementById("top-pages-body");
              const pages = data.topPages || [];
              if (pages.length === 0) {
                topPagesBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #8b9bb4; padding: 20px;">閲覧データがありません。</td></tr>';
              } else {
                topPagesBody.innerHTML = pages.map(p => {
                  return '<tr>' +
                    '<td style="font-weight: 500;">' + formatPathName(p.path) + '</td>' +
                    '<td><strong style="color: #a29bfe;">' + p.pageviews + '</strong> PV <small style="color: #8b9bb4;">(' + p.visitors + '人)</small></td>' +
                    '<td style="color: #ff9f43;">' + formatDuration(p.avg_duration) + '</td>' +
                  '</tr>';
                }).join("");
              }

              // 4. Live Stream
              const streamContainer = document.getElementById("live-stream-container");
              const stream = data.recentPageviews || [];
              if (stream.length === 0) {
                streamContainer.innerHTML = '<p style="color: #8b9bb4; font-size: 0.85rem; padding: 20px 0; text-align: center;">アクセス履歴がありません。</p>';
              } else {
                streamContainer.innerHTML = stream.map(item => {
                  const timeStr = item.created_at ? new Date(item.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "-";
                  const devIcon = item.device === "mobile" ? "📱 スマホ" : (item.device === "tablet" ? "📟 タブレット" : "💻 PC");
                  return '<div class="live-stream-item">' +
                    '<div><span class="live-stream-path">' + formatPathName(item.path) + '</span><div style="font-size: 0.75rem; color: #8b9bb4; margin-top: 2px;">' + (item.referrer_source || "直接") + ' ・ ' + devIcon + '</div></div>' +
                    '<div class="live-stream-meta"><div style="color: #ff9f43; font-weight: bold;">' + formatDuration(item.duration_seconds) + '</div><div>' + timeStr + '</div></div>' +
                  '</div>';
                }).join("");
              }

              // 5. Citizens
              const citizensBody = document.getElementById("citizens-body");
              const citizens = data.recentCitizens || [];
              allCitizensData = citizens;
              if (citizens.length === 0) {
                citizensBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #8b9bb4; padding: 20px;">まだ登録申請はありません。</td></tr>';
              } else {
                citizensBody.innerHTML = citizens.map(c => {
                  const dateStr = c.created_at ? new Date(c.created_at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
                  return '<tr>' +
                    '<td style="font-family: monospace; color: #00d2d3;">' + (c.citizen_id || "-") + '</td>' +
                    '<td style="font-weight: bold; color: #fff;">' + (c.name || "-") + '</td>' +
                    '<td style="color: #8b9bb4; font-size: 0.8rem;">' + dateStr + '</td>' +
                  '</tr>';
                }).join("");
              }

            } catch (err) {
              console.error("Failed to load analytics", err);
            }
          }

          document.getElementById("adm-refresh")?.addEventListener("click", () => {
            timer = 10;
            loadAnalytics();
          });

          document.getElementById("adm-export")?.addEventListener("click", () => {
            if (!allCitizensData.length) {
              alert("エクスポートするデータがありません。");
              return;
            }
            const csvRows = [["ID番号", "識別名", "登録日時", "IPアドレス"]];
            allCitizensData.forEach(c => {
              csvRows.push([c.citizen_id, c.name, c.created_at, c.ip]);
            });
            const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.map(i => '"' + (i || "") + '"').join(",")).join("\\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "univgov_citizens_" + new Date().toISOString().split("T")[0] + ".csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          });

          // Countdown & auto-refresh
          setInterval(() => {
            timer--;
            const timerEl = document.getElementById("adm-timer");
            if (timerEl) timerEl.textContent = timer;
            if (timer <= 0) {
              timer = 10;
              loadAnalytics();
            }
          }, 1000);

          loadAnalytics();
        })();
      </script>
    `
  });
}

function notFoundPage(locale) {
  return shell({
    title: `404 — ${site.name}`,
    description: locale.ui.notFoundDesc,
    locale,
    content: `<section class="not-found"><span>ERROR / 404</span><h1>${locale.ui.notFound}</h1><p>${locale.ui.notFoundDesc}</p><a class="button primary" href="${getPrefix(locale.lang)}/">${locale.ui.backHome}</a></section>`,
  });
}

function generateSitemap() {
  const urls = [];
  const today = new Date().toISOString().split("T")[0];

  // Homepages
  urls.push(`  <url>
    <loc>${site.baseUrl}/</loc>
    <xhtml:link rel="alternate" hreflang="ja" href="${site.baseUrl}/" />
    <xhtml:link rel="alternate" hreflang="en" href="${site.baseUrl}/en/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${site.baseUrl}/" />
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);

  urls.push(`  <url>
    <loc>${site.baseUrl}/en/</loc>
    <xhtml:link rel="alternate" hreflang="ja" href="${site.baseUrl}/" />
    <xhtml:link rel="alternate" hreflang="en" href="${site.baseUrl}/en/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${site.baseUrl}/" />
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`);

  // Articles
  for (const article of articles) {
    const jaUrl = `${site.baseUrl}/articles/${article.slug}`;
    const enUrl = `${site.baseUrl}/en/articles/${article.slug}`;
    const lastmod = article.date;

    urls.push(`  <url>
    <loc>${jaUrl}</loc>
    <xhtml:link rel="alternate" hreflang="ja" href="${jaUrl}" />
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${jaUrl}" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);

    urls.push(`  <url>
    <loc>${enUrl}</loc>
    <xhtml:link rel="alternate" hreflang="ja" href="${jaUrl}" />
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${jaUrl}" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;
}

function generateRobotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${site.baseUrl}/sitemap.xml
`;
}

async function write(path, contents) {
  await mkdir(dirname(resolve(out, path)), { recursive: true });
  await writeFile(resolve(out, path), contents);
}

async function prepareSitesOutput() {
  const client = resolve(out, "client");
  await mkdir(client, { recursive: true });
  for (const entry of ["index.html", "404.html", "portal.html", "portal", "articles", "assets", "en", "sitemap.xml", "robots.txt", "admin.html", "admin", "univgov_all.md", "univgov_all.txt", "univgov_all.en.md", "univgov_all.en.txt", "llms.txt", "llms-full.txt"]) {
    try {
      await cp(resolve(out, entry), resolve(client, entry), { recursive: true });
    } catch (e) {
      // Ignore if doesn't exist
    }
  }
  await write("server/index.js", `export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
`);
}

async function buildLocale(lang) {
  const locale = i18n[lang];
  const renderedArticles = new Map();
  const prefix = lang === "en" ? "en/" : "";

  for (const article of articles) {
    const sourcePath = lang === "en" ? (article.sourceEn ?? article.source) : article.source;
    let markdown = "";
    try {
      markdown = await readFile(resolve(root, sourcePath), "utf8");
    } catch (e) {
      console.warn(`Warning: Could not read ${sourcePath}`);
    }
    renderedArticles.set(article.slug, renderMarkdown(markdown));
  }
  
  await write(`${prefix}index.html`, homepage(renderedArticles, locale));
  
  for (const article of articles) {
    await write(`${prefix}articles/${article.slug}.html`, articlePage(article, renderedArticles.get(article.slug), locale));
  }
  
  await write(`${prefix}404.html`, notFoundPage(locale));
  await write(`${prefix}portal.html`, portalPage(locale));
  await write(`${prefix}portal/index.html`, portalPage(locale));
  
  const searchItems = articles.map((article) => ({
    title: (lang === "en" ? article.displayTitleEn : article.displayTitle) || renderedArticles.get(article.slug).title,
    summary: lang === "en" ? article.summaryEn : article.summary,
    label: lang === "en" ? article.labelEn : article.label,
    url: `/${prefix}articles/${article.slug}`.replace('//', '/'),
  }));

  await write(`assets/search-index-${lang}.json`, JSON.stringify(searchItems));
  if (lang === "ja") {
    await write(`assets/search-index.json`, JSON.stringify(searchItems));
  }
}

async function build() {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  
  await buildLocale("ja");
  await buildLocale("en");
  
  await write("admin.html", adminPage());
  await write("admin/index.html", adminPage());
  
  await write("sitemap.xml", generateSitemap());
  await write("robots.txt", generateRobotsTxt());

  await cp(resolve(root, "site/assets"), resolve(out, "assets"), { recursive: true });
  await write("assets/univgov-qr.svg", await QRCode.toString("https://univgov.pages.dev/", {
    type: "svg",
    width: 296,
    margin: 1,
    color: { dark: "#1f2830", light: "#ffffff" },
  }));
  
  // AI向け完全統合Markdownおよびllms.txtの生成
  await generateAllAiMarkdown();

  await prepareSitesOutput();
  console.log(`Built the UNIVGOV site with GA-style Analytics Dashboard into dist/`);
}

await build();
