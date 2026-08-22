# UNIVGOV//ORBIT

宇宙政府の論考をまとめる、Cloudflare Workers Static Assets 用サイトです。

公開URL: <https://univgov.pages.dev/>

## 記事を更新する

既存原稿は `drafts/` と `univgov_doctrine_v2.md` を直接参照しています。新しい記事は `site/content/` に Markdown で追加し、`site/site.config.mjs` の `articles` に登録します。

```bash
npm run dev
```

ローカル確認後、Cloudflare にログイン済みの環境で Pages へ公開します。

```bash
npm run deploy:univgov
```

## 📜 宇宙政府 最小限必要法典（Minimal Space Law Code）

ノージックの最小国家論、オストロムのコモンズ統治論、ハイエクの貨幣発行自由化論、カントの世界市民法、1967年宇宙条約・国連海洋法条約を統合した、全20条・5編体系のGitネイティブ最小法典。

- **法典正本**: [`UNIVGOV_MINIMAL_LAW.md`](./UNIVGOV_MINIMAL_LAW.md)
- **Web公開版**: [宇宙政府 最小限必要法典](https://univgov.pages.dev/articles/minimal-space-law-code.html)

---


## 🤖 ほかのAIに宇宙政府の考えを読ませる（完全統合Markdown）

宇宙政府の全思想・基本綱領・全論考・宇宙法・Q&A・2026年戦略ロードマップは、AIエージェント（ChatGPT, Claude, Gemini, Cursor等）がコンテキスト欠損なく一括理解・分析できるように **1本の統合Markdown** に自動コンパイルされます。

### 1. ローカルでAIに渡す場合
- **日本語完全版**: [`UNIVGOV_COMPLETE.md`](./UNIVGOV_COMPLETE.md)
- **英語完全版**: [`UNIVGOV_COMPLETE.en.md`](./UNIVGOV_COMPLETE.en.md)
  ※ プロンプトにそのまま貼り付けるか、ファイル添付としてAIに渡すことで、宇宙政府の全思想体系を前提とした対話や分析が可能です。

### 2. Web経由でAIに読ませる場合（URL指定）
Webアクセス機能を持つAIには、サイトのURLではなく以下の直リンクを渡してください（UIノイズなしで100%確実に読み込めます）。
- **全論考統合Markdown (JA)**: `https://univgov.pages.dev/univgov_all.md`
- **全論考統合Markdown (EN)**: `https://univgov.pages.dev/univgov_all.en.md`
- **AI標準インデックス**: `https://univgov.pages.dev/llms.txt`
- **AI標準プレーンテキスト全文**: `https://univgov.pages.dev/llms-full.txt`

### 3. 逐次更新（手動生成）
記事やドラフトを追加・修正した際、以下のコマンドで即座に最新状態に再生成されます（`npm run build:univgov` 時にも自動同期されます）。

```bash
npm run generate:md
```
