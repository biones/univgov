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
npm run deploy
```

ビルド済みHTMLは `dist/` に生成されます。編集対象ではありません。
