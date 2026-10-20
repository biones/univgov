import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import QRCode from "qrcode";
import { articles, site, i18n, spaceLawChapters, aiGovernancePrompts } from "./site.config.mjs";
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
      <a ${active === "guide" ? 'aria-current="page"' : ""} href="${getPrefix(locale.lang)}/articles/easy-guide" style="color: #fbbf24; font-weight: 700;">📖 ${locale.nav.guide}</a>
      <a ${active === "articles" ? 'aria-current="page"' : ""} href="${getPrefix(locale.lang)}/#articles" style="color: #fb923c; font-weight: 600;">🔥 ${locale.nav.articles}</a>
      <a href="${getPrefix(locale.lang)}/#rules">${locale.nav.rules}</a>
      <a href="${getPrefix(locale.lang)}/#laws">${locale.nav.spaceLaw}</a>
      <a href="${site.githubUrl}" target="_blank" rel="noopener noreferrer" style="color: #a78bfa; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
        <svg height="15" width="15" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-bottom;"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
        ${locale.nav.github} ↗
      </a>
      <a href="${site.discordUrl}" target="_blank" rel="noopener noreferrer" style="color: #818cf8; font-weight: 600;">${locale.nav.parliament} ↗</a>
      <a ${active === "portal" ? 'aria-current="page"' : ""} href="${getPrefix(locale.lang)}/portal" class="nav-portal-btn" data-nav-portal style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.35); color: #38bdf8; font-weight: 700; border-radius: 6px; padding: 6px 12px;">🪐 ${locale.lang === "en" ? "Register / Portal (10⁶ UNI)" : "市民登録 / マイポータル (100万UNI)"}</a>
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

  const gaScript = site.googleAnalyticsId
    ? `<!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(site.googleAnalyticsId)}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${escapeHtml(site.googleAnalyticsId)}');
  </script>`
    : "";

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
  ${site.googleSiteVerification ? `<meta name="google-site-verification" content="${escapeHtml(site.googleSiteVerification)}">\n  ` : ""}${canonical ? `<link rel="canonical" href="${canonical}">` : ""}
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
  ${gaScript}
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
      <a href="${site.githubUrl}" target="_blank" rel="noopener noreferrer" style="color: #a78bfa; font-size: 0.9rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
        <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
        <strong>${locale.lang === "en" ? "GitHub (Space Law Code)" : "GitHub (宇宙法典リポジトリ)"} ↗</strong>
      </a>
      <a href="${site.discordUrl}" target="_blank" rel="noopener noreferrer" style="color: #818cf8; font-size: 0.9rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
        <span style="font-size: 1.1rem;">💬</span> <strong>${locale.nav.parliament}</strong>
      </a>
      <a href="${prefix}/portal" style="color: #38bdf8; font-size: 0.9rem; text-decoration: none;">${locale.nav.portal}</a>
    </div>
    <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; margin-top: 6px;">
      <a href="${site.githubUrl}/tree/main/laws" target="_blank" style="color: #cbd5e1; font-size: 0.85rem; text-decoration: none;">📜 ${locale.lang === "en" ? "Browse 20 Law Articles" : "全20条の個別条文 (laws/)"}</a>
      <span style="color: #475569; font-size: 0.8rem;">|</span>
      <a href="${site.githubUrl}/blob/main/SPACE_LAW_MERGE_PROTOCOL.md" target="_blank" style="color: #cbd5e1; font-size: 0.85rem; text-decoration: none;">🔀 ${locale.lang === "en" ? "Merge Protocol (SLMP-1)" : "マージプロトコル (SLMP-1)"}</a>
      <span style="color: #475569; font-size: 0.8rem;">|</span>
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

function renderSpaceLawSection(locale) {
  const isEn = locale.lang === "en";
  const prefix = getPrefix(locale.lang);

  const chaptersHtml = spaceLawChapters.map((ch) => {
    const chTitle = isEn ? ch.titleEn : ch.title;
    const chDesc = isEn ? ch.descEn : ch.desc;

    const articlesHtml = ch.articles.map((art) => {
      const artNum = isEn ? art.numEn : art.num;
      const artTitle = isEn ? art.titleEn : art.title;
      const artSummary = isEn ? art.summaryEn : art.summary;
      const artRoots = isEn ? art.rootsEn : art.roots;
      const artSunset = isEn ? art.sunsetEn : art.sunset;
      const ghUrl = `${site.githubUrl}/blob/main/laws/${art.path}`;

      return `
        <div class="law-card">
          <div class="law-card-header">
            <span class="law-num">${artNum}</span>
            <span class="law-sunset" title="${isEn ? 'Sunset self-expiration period' : '義務的サンセット失効期日'}">⏱️ ${artSunset}</span>
          </div>
          <h4 class="law-title">${escapeHtml(artTitle)}</h4>
          <p class="law-summary">${escapeHtml(artSummary)}</p>
          <div class="law-roots">
            <span>📚 ${isEn ? "Roots: " : "思想的背景: "}</span><strong>${escapeHtml(artRoots)}</strong>
          </div>
          <div class="law-actions">
            <a href="${prefix}/articles/minimal-space-law-code" class="law-read-link">
              ${locale.ui.spaceLawViewArticle}
            </a>
            <a href="${ghUrl}" target="_blank" rel="noopener noreferrer" class="law-gh-link">
              <svg height="12" width="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
              <span>PR / Edit</span>
            </a>
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="law-chapter-block">
        <div class="law-chapter-head">
          <span class="law-chapter-badge">BOOK ${ch.num}</span>
          <h3>${escapeHtml(chTitle)}</h3>
          <p>${escapeHtml(chDesc)}</p>
        </div>
        <div class="law-cards-grid">
          ${articlesHtml}
        </div>
      </div>
    `;
  }).join("");

  return `
    <section class="space-law-section" id="laws" aria-labelledby="laws-title">
      <div class="section-head">
        <div>
          <span>06 / SPACE LAW CODE</span>
          <h2 id="laws-title">${locale.ui.spaceLawTitle}</h2>
        </div>
        <p>${locale.ui.spaceLawSub}</p>
      </div>

      <div class="space-law-container">
        ${chaptersHtml}
      </div>

      <div class="space-law-footer-cta">
        <a href="${prefix}/articles/minimal-space-law-code" class="button primary">
          📖 ${isEn ? "Read Full 20-Article Code Text" : "最小限必要法典の解説・全文を読む"}
        </a>
        <a href="${site.githubUrl}/tree/main/laws" target="_blank" rel="noopener noreferrer" class="button ghost">
          <svg height="15" width="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
          <span>${isEn ? "Open laws/ Repository on GitHub" : "GitHubの条文ディレクトリを開く"} ↗</span>
        </a>
      </div>
    </section>
  `;
}

function renderAiToolkitSection(locale) {
  const isEn = locale.lang === "en";
  const prefix = getPrefix(locale.lang);
  const contextUrl = `${site.baseUrl}/univgov_all.md`;

  const cardsHtml = aiGovernancePrompts.map((p) => {
    const title = isEn ? p.titleEn : p.title;
    const badge = isEn ? p.badgeEn : p.badge;
    const desc = isEn ? p.descEn : p.desc;

    return `
      <div class="ai-prompt-card">
        <div class="ai-prompt-head">
          <span class="ai-prompt-badge">${badge}</span>
          <h4>${escapeHtml(title)}</h4>
          <p>${escapeHtml(desc)}</p>
        </div>
        <div class="ai-prompt-box">
          <pre><code>${escapeHtml(p.prompt)}</code></pre>
        </div>
        <div class="ai-prompt-foot">
          <button type="button" class="button primary small btn-copy-prompt" data-prompt-text="${escapeHtml(p.prompt)}">
            📋 <span>${locale.ui.aiPromptCopy}</span>
          </button>
        </div>
      </div>
    `;
  }).join("");

  return `
    <section class="ai-toolkit-section" id="ai-toolkit" aria-labelledby="ai-toolkit-title">
      <div class="section-head">
        <div>
          <span>11 / AI GOVERNANCE TOOLKIT</span>
          <h2 id="ai-toolkit-title">${locale.ui.aiToolkitTitle}</h2>
        </div>
        <p>${locale.ui.aiToolkitSub}</p>
      </div>

      <div class="ai-context-banner">
        <div class="ai-context-info">
          <span class="ai-context-tag">🤖 LLM CONTEXT LAYER</span>
          <h3>${isEn ? "One-Shot Knowledge Context for Gemini & AI Agents" : "Gemini / AIエージェント向け 1発投入コンテキスト"}</h3>
          <p>${isEn ? "Feed the complete UNIVGOV doctrine, 20-article code, and economic protocols in a single Markdown file." : "全20条の宇宙法典、経済プロトコル、思想録の全文が1ファイルに統合されたAI用Markdownです。GeminiやClaude等にそのまま読み込ませて対話できます。"}</p>
        </div>
        <div class="ai-context-actions">
          <button type="button" class="button primary small" id="btn-copy-context-url" data-context-url="${contextUrl}">
            🔗 <span>${locale.ui.aiContextCopy}</span>
          </button>
          <a href="${prefix === "" ? "/univgov_all.md" : "/univgov_all.en.md"}" target="_blank" class="button ghost small">
            📄 univgov_all.md ↗
          </a>
        </div>
      </div>

      <div class="ai-prompts-grid">
        ${cardsHtml}
      </div>
    </section>
  `;
}

function renderLatestArticlesSection(renderedArticles, locale, prefix, latestArticles) {
  const ui = locale.ui;
  const cardsHtml = latestArticles.map((item) => card(item, renderedArticles.get(item.slug), locale)).join("");

  return `
    <!-- Top Latest Articles Section -->
    <section class="latest-articles-section" id="articles" aria-labelledby="latest-articles-title">
      <div class="latest-articles-container">
        <div class="section-head" style="margin-bottom: 24px;">
          <div>
            <span style="color: #fb923c;">01 / LATEST ESSAYS</span>
            <h2 id="latest-articles-title">${ui.latestSectionTitle}</h2>
          </div>
          <p>${ui.latestSectionSub}</p>
        </div>

        <div class="latest-cards-grid">
          ${cardsHtml}
        </div>

        <div class="latest-articles-footer">
          <a href="#deep-dive" onclick="document.getElementById('deep-dive').open=true; document.getElementById('archive-title')?.scrollIntoView({behavior:'smooth'});" class="button ghost">
            📚 <span>${ui.viewAllArchive}</span>
          </a>
        </div>
      </div>
    </section>
  `;
}

function renderExplainerSection(locale) {
  const ui = locale.ui;
  const prefix = getPrefix(locale.lang);
  const chaptersHtml = (ui.chapters || []).map((ch, idx) => `
    <details class="chapter-card" ${idx === 0 ? "open" : ""}>
      <summary class="chapter-summary">
        <span class="chapter-num">${ch.num}</span>
        <span class="chapter-title">${escapeHtml(ch.title)}</span>
        <span class="chapter-toggle" aria-hidden="true">▾</span>
      </summary>
      <div class="chapter-body">
        <p>${escapeHtml(ch.summary)}</p>
      </div>
    </details>
  `).join("");

  return `
    <!-- Plain-language Explainer Section -->
    <section class="explainer-section easy-section" id="about-univgov">
      <div class="explainer-container">
        <div class="section-head" style="margin-bottom: 24px;">
          <div>
            <span style="color: #38bdf8;">${locale.lang === "en" ? "02 / WHAT IS THIS?" : "02 / これはなに？"}</span>
            <h2>${ui.explainTitle}</h2>
          </div>
          <p>${ui.explainSub}</p>
        </div>

        <div class="easy-oneliner">
          <span class="easy-oneliner-label">${locale.lang === "en" ? "In one sentence" : "ひとことで言うと"}</span>
          <p>${ui.explainOneLiner}</p>
        </div>
        <div class="easy-intro">
          <p>${ui.explainIntro1}</p>
          <p>${ui.explainIntro2}</p>
        </div>

        <!-- Heroic Guide Banner Card -->
        <div class="guide-banner-card">
          <div class="guide-banner-badge">${ui.guideBannerBadge}</div>
          <div class="guide-banner-content">
            <h3>${ui.guideBannerTitle}</h3>
            <p class="guide-banner-sub">${ui.guideBannerSub}</p>
            <p class="guide-banner-desc">${ui.guideBannerDesc}</p>
            <a href="${prefix}/articles/easy-guide" class="button primary guide-banner-btn">
              <span>${ui.guideBannerBtn}</span>
            </a>
          </div>
        </div>

        <div class="explainer-grid">
          <!-- Legacy State Card -->
          <div class="explainer-card legacy">
            <span class="explainer-badge">🏛️ ${ui.explainLegacyTag}</span>
            <h3>${ui.explainLegacyTitle}</h3>
            <ul class="explainer-list">
              <li>
                <span class="icon">🔒</span>
                <span>${ui.explainLegacy1}</span>
              </li>
              <li>
                <span class="icon">❌</span>
                <span>${ui.explainLegacy2}</span>
              </li>
              <li>
                <span class="icon">🚪</span>
                <span>${ui.explainLegacy3}</span>
              </li>
            </ul>
          </div>

          <!-- Univgov Modular Card -->
          <div class="explainer-card univgov">
            <span class="explainer-badge">🪐 ${ui.explainUnivgovTag}</span>
            <h3>${ui.explainUnivgovTitle}</h3>
            <ul class="explainer-list">
              <li>
                <span class="icon">✅</span>
                <span>${ui.explainUnivgov1}</span>
              </li>
              <li>
                <span class="icon">🔁</span>
                <span>${ui.explainUnivgov2}</span>
              </li>
              <li>
                <span class="icon">🚪</span>
                <span>${ui.explainUnivgov3}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 5 Chapters Highlight Accordion -->
        <div class="chapters-wrap">
          <div class="chapters-head">
            <h3>${ui.chaptersTitle}</h3>
            <p>${ui.chaptersSub}</p>
          </div>
          <div class="chapters-list">
            ${chaptersHtml}
          </div>
        </div>

        <div class="easy-guide-link-wrap">
          <a class="easy-guide-link" href="${prefix}/articles/easy-guide">${ui.explainGuideLink}</a>
        </div>
      </div>
    </section>
  `;
}

function renderStepsSection(locale, prefix) {
  const ui = locale.ui;
  return `
    <!-- 3 Actionable Steps Section -->
    <section class="steps-section easy-section" id="how-to-start">
      <div class="steps-container">
        <div class="section-head" style="margin-bottom: 20px;">
          <div>
            <span style="color: #38bdf8;">${locale.lang === "en" ? "03 / WHERE TO START" : "03 / はじめかた"}</span>
            <h2>${ui.stepsTitle}</h2>
          </div>
          <p>${ui.stepsSub}</p>
        </div>

        <div class="steps-grid">
          <!-- Step 1 -->
          <div class="step-card">
            <div class="step-header">
              <span class="step-num">${ui.step1Num}</span>
              <span class="step-tag">${ui.step1Tag}</span>
            </div>
            <h3>${ui.step1Title}</h3>
            <p>${ui.step1Desc}</p>
            <a href="${prefix}/articles/easy-guide" class="step-link">${ui.step1Link}</a>
          </div>

          <!-- Step 2 -->
          <div class="step-card" style="border-color: rgba(56, 189, 248, 0.4); background: linear-gradient(145deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%);">
            <div class="step-header">
              <span class="step-num">${ui.step2Num}</span>
              <span class="step-tag" style="background: #0284c7; color: #fff; border-color: #38bdf8;">${ui.step2Tag}</span>
            </div>
            <h3>${ui.step2Title}</h3>
            <p>${ui.step2Desc}</p>
            <a href="#register" class="step-link" style="color: #38bdf8; font-weight: 700;">${ui.step2Link}</a>
          </div>

          <!-- Step 3 -->
          <div class="step-card">
            <div class="step-header">
              <span class="step-num">${ui.step3Num}</span>
              <span class="step-tag">${ui.step3Tag}</span>
            </div>
            <h3>${ui.step3Title}</h3>
            <p>${ui.step3Desc}</p>
            <a href="${site.discordUrl}" target="_blank" rel="noopener noreferrer" class="step-link">${ui.step3Link}</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderFaqSection(locale) {
  const ui = locale.ui;
  const items = [
    ["🛡️", ui.faq1Q, ui.faq1A],
    ["💴", ui.faq2Q, ui.faq2A],
    ["⚖️", ui.faq3Q, ui.faq3A],
    ["🧾", ui.faq4Q, ui.faq4A],
    ["🪙", ui.faq5Q, ui.faq5A],
  ].filter(([, q]) => q);
  return `
    <!-- FAQ & Misconceptions Section -->
    <section class="faq-section easy-section" id="faq">
      <div class="faq-container">
        <div class="section-head" style="margin-bottom: 20px;">
          <div>
            <span style="color: #38bdf8;">${locale.lang === "en" ? "04 / COMMON WORRIES" : "04 / よくある心配ごと"}</span>
            <h2>${ui.faqSectionTitle}</h2>
          </div>
          <p>${ui.faqSectionSub}</p>
        </div>

        <div class="faq-grid">
          ${items.map(([icon, q, a]) => `
          <div class="faq-card">
            <h3><span>${icon}</span> <span>${q}</span></h3>
            <p>${a}</p>
          </div>`).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderGlossarySection(locale) {
  const ui = locale.ui;
  if (!ui.glossary?.length) return "";
  return `
    <!-- Glossary Section -->
    <section class="glossary-section easy-section" id="glossary">
      <div class="section-head" style="margin-bottom: 20px;">
        <div>
          <span style="color: #38bdf8;">${locale.lang === "en" ? "05 / GLOSSARY" : "05 / 言葉の意味"}</span>
          <h2>${ui.glossaryTitle}</h2>
        </div>
        <p>${ui.glossarySub}</p>
      </div>
      <dl class="glossary-list">
        ${ui.glossary.map(([term, desc]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(desc)}</dd></div>`).join("")}
      </dl>
    </section>
  `;
}

function homepage(renderedArticles, locale) {
  const prefix = getPrefix(locale.lang);
  const isEn = locale.lang === "en";
  const sortedArticles = [...articles].sort((a, b) => b.date.localeCompare(a.date));
  const latestArticle = sortedArticles[0];
  const topLatestArticles = sortedArticles.slice(0, 3);
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
          <div class="hero-latest-bar">
            <a href="${prefix}/articles/${latestArticle.slug}" class="hero-latest-pill">
              <span class="pill-badge">${locale.ui.latestBadge} (${latestArticle.date.replaceAll("-", ".")})</span>
              <span class="pill-title">${inline(isEn ? latestArticle.displayTitleEn : latestArticle.displayTitle)}</span>
              <span class="pill-arrow">${locale.ui.read}</span>
            </a>
          </div>
          <p class="kicker">${locale.ui.heroKicker}</p>
          <h2>${locale.ui.heroTitle}</h2>
          <p class="lead">${locale.ui.heroLead1}</p>
          <p class="lead">${locale.ui.heroLead2}</p>
          <div class="hero-actions">
            <a class="button hero-register-btn" href="#register" style="background: #0284c7; border-color: #38bdf8; color: #fff; box-shadow: 0 0 16px rgba(56, 189, 248, 0.35); font-weight: 700;">${locale.ui.heroRegisterBtn}</a>
            <a class="button primary" href="${prefix}/articles/${latestArticle.slug}" style="background: linear-gradient(135deg, rgba(234, 88, 12, 0.25) 0%, rgba(194, 65, 12, 0.35) 100%); border-color: #ea580c; color: #fb923c; font-weight: 700;">🔥 ${isEn ? "Latest Essay" : "最新論考を読む"}</a>
            <a class="button ghost" href="#articles">📖 ${locale.ui.readArticles}</a>
            <a class="button ghost" href="${prefix}/articles/easy-guide" style="background: rgba(56, 189, 248, 0.1); border-color: rgba(56, 189, 248, 0.3); color: #38bdf8;">${isEn ? "Guide" : "入門解説"}</a>
            <a class="button ghost" href="#deep-dive" onclick="document.getElementById('deep-dive').open=true;">${locale.ui.readPrinciples}</a>
          </div>
        </div>
      </section>

      ${renderLatestArticlesSection(renderedArticles, locale, prefix, topLatestArticles)}

      ${renderExplainerSection(locale)}

      ${renderStepsSection(locale, prefix)}

      ${renderFaqSection(locale)}

      ${renderGlossarySection(locale)}

      <section class="registration" id="register" aria-labelledby="register-title">
        <div class="section-head">
          <div>
            <span style="color: #38bdf8;">${locale.lang === "en" ? "06 / REGISTRATION & UNI GRANT" : "06 / 市民登録とUNI付与"}</span>
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

      <!-- Advanced Deep Dive Section (Collapsible) -->
      <section class="deep-dive-band" id="deep-dive-section" aria-labelledby="deep-dive-title" style="margin: 60px auto; max-width: 1180px; padding: 0 20px;">
        <details class="deep-dive-details" id="deep-dive">
          <summary class="deep-dive-summary">
            <div class="deep-dive-summary-head">
              <span class="deep-dive-kicker">07 / DEEP DIVE</span>
              <h2 id="deep-dive-title" style="margin: 8px 0; font-size: clamp(22px, 2.5vw, 32px); color: #f1f5f9;">${locale.ui.moreTitle}</h2>
              <p style="margin: 0; color: #94a3b8; font-size: 14px; max-width: 760px;">${locale.ui.moreSub}</p>
            </div>
            <div class="deep-dive-toggle-badge">
              <span>${locale.ui.moreOpen}</span>
            </div>
          </summary>

          <div class="deep-dive-content" style="margin-top: 40px;">
            <!-- Pathways Section -->
            <section class="pathways-section" style="margin: 30px auto 50px;">
              <div class="section-head">
                <div>
                  <span>PATHWAYS</span>
                  <h2>${locale.lang === "en" ? "Where to Begin: 4 Entry Points" : "あなたに合った最初の入り口"}</h2>
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
                  <h3 style="font-size: 1.15rem; margin-bottom: 8px; color: #f59e0b;">${locale.lang === "en" ? "For Policy & Governance Practitioners" : "政策・行政・実務者向け"}</h3>
                  <p style="font-size: 0.9rem; color: #94a3b8; line-height: 1.6; margin-bottom: 16px;">
                    ${locale.lang === "en" ? "Real-world policy evaluation cards (e.g. municipal IT procurement, public subsidies) using open data and empirical cost-benefit metrics." : "自治体IT標準化や公金調達など、制度疲労と公金配分を『政策評価カード』でデータ検証するパイロット事例。"}
                  </p>
                  <a href="${prefix}/articles/stress-test" style="color: #f59e0b; font-size: 0.88rem; font-weight: 600; text-decoration: none;">${locale.lang === "en" ? "View Policy Evaluation Card →" : "政策評価カードの実例を見る →"}</a>
                </div>
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px;">
                  <div style="font-size: 1.8rem; margin-bottom: 12px;">⚖️</div>
                  <h3 style="font-size: 1.15rem; margin-bottom: 8px; color: #a78bfa;">${locale.lang === "en" ? "Space Law & Git Governance" : "宇宙法典 ＆ Gitガバナンス"}</h3>
                  <p style="font-size: 0.9rem; color: #94a3b8; line-height: 1.6; margin-bottom: 16px;">
                    ${locale.lang === "en" ? "20 modular articles, anti-election merge protocol (SLMP-1), and open-source legislation via GitHub PRs." : "選挙・国家司法を排した全20条のモジュール法典。GitHub上で特定の条文に直接突っ込み・PR・Forkできるオープン立法プロトコル。"}
                  </p>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    <a href="#laws" style="color: #a78bfa; font-size: 0.88rem; font-weight: 700; text-decoration: none;">
                      ${locale.lang === "en" ? "Explore 20-Article Code on Site ↓" : "宇宙法典 全20条ブラウザを見る ↓"}
                    </a>
                    <a href="${site.githubUrl}/tree/main/laws" target="_blank" rel="noopener noreferrer" style="color: #cbd5e1; font-size: 0.82rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                      <svg height="12" width="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
                      <span>GitHub (laws/) ↗</span>
                    </a>
                  </div>
                </div>
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px;">
                  <div style="font-size: 1.8rem; margin-bottom: 12px;">⚙️</div>
                  <h3 style="font-size: 1.15rem; margin-bottom: 8px; color: #38bdf8;">${locale.lang === "en" ? "For Engineers & AI Agents" : "技術者・AIエージェント向け"}</h3>
                  <p style="font-size: 0.9rem; color: #94a3b8; line-height: 1.6; margin-bottom: 16px;">
                    ${locale.lang === "en" ? "ZK-KYC, DIDs, multi-sig governance, and single-file complete Markdown for LLM analysis." : "ゼロ知識証明、DID、マルチシグ統治、およびAIが1発で全思想を読み込める統合Markdown（univgov_all.md / llms.txt）。"}
                  </p>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    <a href="#ai-toolkit" style="color: #38bdf8; font-size: 0.88rem; font-weight: 700; text-decoration: none;">
                      ${locale.lang === "en" ? "AI Governance Prompt Kit ↓" : "AI政策監査プロンプトキット ↓"}
                    </a>
                    <a href="${prefix === "" ? "/univgov_all.md" : "/univgov_all.en.md"}" target="_blank" style="color: #cbd5e1; font-size: 0.82rem; text-decoration: none;">
                      ${locale.lang === "en" ? "univgov_all.md (Full Context) ↗" : "univgov_all.md（全思想集成） ↗"}
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <!-- Featured Section -->
            <section class="featured-section" aria-labelledby="featured-title">
              <div class="section-head"><div><span>FEATURED</span><h2 id="featured-title">${locale.ui.featuredTitle}</h2></div><p>${locale.ui.featuredSub}</p></div>
              <div class="featured-grid">${featured}</div>
            </section>

            <!-- Manifesto Band -->
            <section class="manifesto-band">
              <h2>${locale.ui.manifestoTitle}</h2>
              <a href="${prefix}/articles/hundred-year-thesis">${locale.ui.readManifesto}</a>
            </section>

            <!-- Principles -->
            <section class="principles" id="rules" aria-labelledby="principles-title">
              <div class="section-head"><div><span>PRINCIPLES</span><h2 id="principles-title">${locale.ui.principlesTitle}</h2></div><p>${locale.ui.principlesSub}</p></div>
              <ol class="principle-list">${locale.principles.map(([n, title, text]) => `<li><span>${n}</span><h3>${title}</h3><p>${text}</p></li>`).join("")}</ol>
            </section>

            <!-- Space Law Section -->
            ${renderSpaceLawSection(locale)}

            <!-- Parliament Section -->
            <section class="parliament-section" id="parliament" aria-labelledby="parliament-title">
              <div class="section-head">
                <div>
                  <span>PARLIAMENT</span>
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
                      <h3>${locale.ui.parliamentXTitle ? (locale.lang === "en" ? "Discord Permanent Council & Workgroups" : "Discord 常任委員会・作業部会") : ""}</h3>
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

            <!-- BTC Zone Section -->
            <section class="btc-zone-section" id="btc-zone" aria-labelledby="btc-zone-title">
              <div class="section-head">
                <div>
                  <span>CURRENCY & BTC ZONE</span>
                  <h2 id="btc-zone-title">${locale.ui.btcZoneTitle}</h2>
                </div>
                <p>${locale.ui.btcZoneSub}</p>
              </div>

              <div class="btc-zone-grid">
                <!-- Cosmic Currency UNI Protocol -->
                <div class="btc-zone-card accent-uni" style="border-color: rgba(56, 189, 248, 0.35); background: linear-gradient(145deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%);">
                  <div class="zone-card-icon" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8;">🪐</div>
                  <h3 style="color: #38bdf8;">${locale.lang === "en" ? "0. Cosmic Currency UNI (10⁶ Fixed Grant)" : "0. 宇宙通貨 UNI（初期付与 10⁶ UNI・固定供給）"}</h3>
                  <p>${locale.lang === "en" ? "Every registered citizen receives 1,000,000 UNI as an initial bootstrapping grant (fixed total supply, no arbitrary inflation). A non-state currency (~1 JPY scale) for instant P2P transfers & modular settlement." : "宇宙国民アカウントを開設した全市民に 1,000,000 UNI を初期交付（固定総供給・恣意的増刷なし）。国家のシニョリッジを排し、約1円スケール（変動相場）で市民間直接決済・価値交換を実現。"}</p>
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

            <!-- AI Toolkit Section -->
            ${renderAiToolkitSection(locale)}

            <!-- Archive Section -->
            <section class="archive" id="archive" aria-labelledby="archive-title">
              <div class="section-head"><div><span>ARCHIVE</span><h2 id="archive-title">${locale.ui.archiveTitle}</h2></div><div class="archive-tools"><label for="archive-search">${locale.ui.archiveFilter}</label><input id="archive-search" type="search" placeholder="${locale.ui.searchPlaceholder}" data-card-filter></div></div>
              <div class="article-grid" data-card-grid>${allCards}</div>
              <p class="empty-state" data-empty-state hidden>${locale.ui.notFound}</p>
            </section>

            <!-- Declaration -->
            <section class="declaration">
              <span>PARTICIPATE / EXIT</span>
              <h2>${locale.ui.declarationTitle}</h2>
              <p>${locale.ui.declarationDesc}</p>
              <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
                <a class="button primary" href="${prefix}/articles/cosmic-citizen-declaration">${locale.ui.readDeclaration}</a>
                <a class="button" style="background: #5865F2; color: #fff; border: 1px solid #5865F2; font-weight: bold;" href="${site.discordUrl}" target="_blank" rel="noopener noreferrer">💬 ${locale.ui.joinParliament}</a>
              </div>
            </section>
          </div>
        </details>
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
    "@graph": [
      {
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
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": locale.nav.home,
            "item": `${site.baseUrl}${prefix}/`
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": locale.nav.articles,
            "item": `${site.baseUrl}${prefix}/#articles`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": displayTitle ?? rendered.title,
            "item": canonical
          }
        ]
      }
    ]
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

          <!-- Social Share Bar (Top) -->
          <div class="article-share-bar">
            <span class="share-bar-label">${locale.lang === "en" ? "Share:" : "シェア:"}</span>
            <a class="share-btn x-btn" href="https://x.com/intent/post?text=${encodeURIComponent(`${displayTitle ?? rendered.title}\n#UNIVGOV #宇宙政府\n${canonical}`)}" target="_blank" rel="noopener noreferrer" title="Post on 𝕏">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              <span>${locale.ui.shareOnX}</span>
            </a>
            <a class="share-btn bluesky-btn" href="https://bsky.app/intent/compose?text=${encodeURIComponent(`${displayTitle ?? rendered.title}\n${canonical}`)}" target="_blank" rel="noopener noreferrer" title="Share on Bluesky">
              <svg width="13" height="13" viewBox="0 0 568 501" fill="currentColor"><path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.209C491.544 -2.947 568-23.774 568 69.176c0 18.57-10.518 156.402-16.691 178.437-21.439 76.516-99.397 96.046-168.434 84.347 120.59 20.468 151.782 89.378 85.125 157.739-75.973 77.915-163.754-19.562-184-63.699-20.246 44.137-108.027 141.614-184 63.699-66.657-68.361-35.465-137.271 85.125-157.739C116.088 343.659 38.13 324.129 16.691 247.613 10.518 225.578 0 87.746 0 69.176 0-23.774 76.456-2.947 123.121 33.664z"/></svg>
              <span>Bluesky</span>
            </a>
            <a class="share-btn line-btn" href="https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(canonical)}&text=${encodeURIComponent(displayTitle ?? rendered.title)}" target="_blank" rel="noopener noreferrer" title="Share on LINE">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.777.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.013 14.484 24 12.518 24 10.304z"/></svg>
              <span>LINE</span>
            </a>
            <button type="button" class="share-btn copy-btn" data-copy-link="${canonical}" title="Copy Link">
              <span>🔗 ${locale.ui.shareCopyUrl}</span>
            </button>
          </div>
        </header>
        <div class="article-layout">
          <aside class="article-toc"><span>${locale.ui.toc}</span>${toc || `<a href="#article-body">${locale.ui.body}</a>`}</aside>
          <div class="prose" id="article-body">
            ${rendered.html}

            <!-- Social Share Bar (Bottom of Content) -->
            <div class="article-share-bar bottom-share-bar" style="margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08);">
              <span class="share-bar-label">${locale.lang === "en" ? "Share this thesis:" : "この論考を共有:"}</span>
              <a class="share-btn x-btn primary-share" href="https://x.com/intent/post?text=${encodeURIComponent(`${displayTitle ?? rendered.title}\n#UNIVGOV #宇宙政府\n${canonical}`)}" target="_blank" rel="noopener noreferrer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                <span>${locale.ui.shareOnX}</span>
              </a>
              <a class="share-btn bluesky-btn" href="https://bsky.app/intent/compose?text=${encodeURIComponent(`${displayTitle ?? rendered.title}\n${canonical}`)}" target="_blank" rel="noopener noreferrer">
                <svg width="14" height="14" viewBox="0 0 568 501" fill="currentColor"><path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.209C491.544 -2.947 568-23.774 568 69.176c0 18.57-10.518 156.402-16.691 178.437-21.439 76.516-99.397 96.046-168.434 84.347 120.59 20.468 151.782 89.378 85.125 157.739-75.973 77.915-163.754-19.562-184-63.699-20.246 44.137-108.027 141.614-184 63.699-66.657-68.361-35.465-137.271 85.125-157.739C116.088 343.659 38.13 324.129 16.691 247.613 10.518 225.578 0 87.746 0 69.176 0-23.774 76.456-2.947 123.121 33.664z"/></svg>
                <span>Bluesky</span>
              </a>
              <a class="share-btn line-btn" href="https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(canonical)}&text=${encodeURIComponent(displayTitle ?? rendered.title)}" target="_blank" rel="noopener noreferrer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.777.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.013 14.484 24 12.518 24 10.304z"/></svg>
                <span>LINE</span>
              </a>
              <button type="button" class="share-btn copy-btn" data-copy-link="${canonical}">
                <span>🔗 ${locale.ui.shareCopyUrl}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- High-Conversion Registration CTA Banner -->
        <div class="article-register-cta" style="margin: 40px auto; max-width: 820px; background: linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 16px; padding: 36px 24px; text-align: center; box-shadow: 0 10px 36px rgba(0, 0, 0, 0.5);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🪐 🛡️</div>
          <h3 style="margin: 0 0 10px 0; color: #38bdf8; font-size: 1.35rem; font-weight: 700;">${locale.ui.articleRegisterCtaTitle}</h3>
          <p style="font-size: 0.92rem; color: #cbd5e1; line-height: 1.7; max-width: 620px; margin: 0 auto 24px auto;">
            ${locale.ui.articleRegisterCtaDesc}
          </p>
          <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
            <a href="${prefix}/portal" class="button primary" style="background: #0284c7; border-color: #38bdf8; color: #fff; font-size: 0.95rem; padding: 12px 24px; font-weight: 700; box-shadow: 0 0 20px rgba(56, 189, 248, 0.35);">
              ${locale.ui.articleRegisterCtaBtn}
            </a>
            <a href="${prefix}/#articles" class="button ghost" style="font-size: 0.9rem; padding: 12px 20px;">
              ${locale.ui.readMore}
            </a>
          </div>
        </div>

        <!-- GitHub Law CTA Banner -->
        <div style="margin: 40px auto; max-width: 820px; background: rgba(167, 139, 250, 0.08); border: 1px solid rgba(167, 139, 250, 0.25); border-radius: 12px; padding: 24px; text-align: center;">
          <div style="font-size: 1.5rem; margin-bottom: 8px;">⚖️ 🔀</div>
          <h3 style="margin: 0 0 8px 0; color: #a78bfa; font-size: 1.15rem;">${locale.lang === "en" ? "Review, Suggest Edits, or Fork This Law on GitHub" : "この条文・宇宙法典をGitHubで改訂・突っ込み・Forkする"}</h3>
          <p style="font-size: 0.88rem; color: #94a3b8; line-height: 1.6; margin: 0 0 16px 0;">
            ${locale.lang === "en" ? "UNIVGOV laws are modular open-source protocols. Submit Pull Requests, open Issues on specific articles, or fork the entire legal code without permission." : "宇宙法は偉い人が決めた永久の命令ではありません。全20条が1条1ファイルでモジュール管理されており、GitHub上で特定の条文（例: 第2編第10条）へ直接PR（修正提案）やIssue（問題提起）を送ることができます。"}
          </p>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <a href="${site.githubUrl}/tree/main/laws" target="_blank" rel="noopener noreferrer" style="background: #8b5cf6; color: #fff; padding: 8px 16px; border-radius: 6px; font-weight: 700; text-decoration: none; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 6px;">
              <svg height="15" width="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
              ${locale.lang === "en" ? "Browse 20 Law Articles on GitHub ↗" : "GitHubで全20条の条文を見る ↗"}
            </a>
            <a href="${site.githubUrl}/blob/main/SPACE_LAW_MERGE_PROTOCOL.md" target="_blank" rel="noopener noreferrer" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; padding: 8px 16px; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 0.9rem;">
              ${locale.lang === "en" ? "Merge Protocol (SLMP-1) ↗" : "マージプロトコル (SLMP-1) ↗"}
            </a>
          </div>
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

                <div class="card-action-bar" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px;">
                  <a href="https://x.com/intent/post?text=${encodeURIComponent(isEn ? "I've officially registered as a Cosmic Citizen and received 1,000,000 UNI grant!\n#UNIVGOV #UniverseGovernment\nhttps://univgov.pages.dev" : "【宇宙国民証 発行完了】\n宇宙政府（UNIVGOV）の宇宙国民アカウントを開設し、初期宇宙基本給 1,000,000 UNI を受給しました！🪐🛡️\n\n土地は選べなくても、帰属は選べる。\n#UNIVGOV #宇宙政府\nhttps://univgov.pages.dev")}" target="_blank" rel="noopener noreferrer" class="button" style="background: #000; border: 1px solid #38bdf8; color: #38bdf8; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 0 12px rgba(56, 189, 248, 0.25);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    <span>${isEn ? "Share Citizen ID on 𝕏" : "𝕏 で国民証発行を報告 ↗"}</span>
                  </a>
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
                    ${isEn ? "CURRENT AVAILABLE UNI BALANCE" : "現在の保有残高（初期分配＋取引残高）"}
                  </div>
                  <div style="font-size: clamp(2.2rem, 4vw, 3rem); font-weight: 800; color: #38bdf8; font-family: monospace; letter-spacing: -0.5px; text-shadow: 0 0 20px rgba(56, 189, 248, 0.3);">
                    <span id="vault-uni-balance">1,000,000</span> <span style="font-size: 1.2rem; font-weight: 600; color: #94a3b8;">UNI</span>
                  </div>
                  <div style="font-size: 0.8rem; color: #64748b; margin-top: 6px;">
                    ${isEn 
                      ? "🎉 1,000,000 UNI (10⁶ UNI) initial bootstrapping grant deposited upon citizenship issuance (fixed supply)." 
                      : "🎉 宇宙国民証発行に伴い、初期原資 1,000,000 UNI（10⁶ UNI・固定供給）が付与されています。"}
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
    const htmlContent = articlePage(article, renderedArticles.get(article.slug), locale);
    await write(`${prefix}articles/${article.slug}.html`, htmlContent);
    await write(`${prefix}articles/${article.slug}/index.html`, htmlContent);
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
