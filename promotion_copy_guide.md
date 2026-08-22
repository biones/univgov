# 宇宙政府（UNIVGOV）宣伝フック＆コンバージョン向上マニュアル

更新日: 2026年8月8日

本ガイドは、X（Twitter）でのバズツイートぶら下げ、Discord飲酒サーバー、LINEオープンチャット、およびリアル飲み会において、宇宙政府（UNIVGOV）の認知・理解・アクセス数を最大化するための具体的コピー集および運用ガイドです。

---

## 1. 流入計測（UTMリンク）の準備

投稿や共有を行う際は、以下の追跡タグ付きリンクを使用するか、`npm run utm` コマンドで生成してください。

| 媒体 / シチュエーション | 追跡用URL |
|---|---|
| **X バズぶら下げ (トップ)** | `https://univgov.pages.dev/?utm_source=x&utm_medium=reply&utm_campaign=buzz_thread` |
| **X 議論スレッド (Q&A)** | `https://univgov.pages.dev/articles/questions-and-objections?utm_source=x&utm_medium=reply&utm_campaign=qa_article` |
| **Discord 飲酒鯖** | `https://univgov.pages.dev/?utm_source=discord&utm_medium=drink_server` |
| **LINE オープンチャット** | `https://univgov.pages.dev/?utm_source=line_oc&utm_medium=chat` |
| **リアル飲み会 (/nomi)** | `https://univgov.pages.dev/nomi?utm_source=real_nomi&utm_medium=qr` |

---

## 2. X（Twitter）バズツイートぶら下げリプライ用コピー

バズリプぶら下げは「単なるスパム」に見えるとスルーされるか非表示にされます。元ツイートの文脈（テーマ）に寄り添いつつ、自然に宇宙政府の切り口へ接続するのが鉄則です。

### Pattern A: 物価高・手取り・税金愚痴ツイートのバズ
> **フック:**  
> 「手取りが増えないのに税金だけ引かれるの、国が『使わないサービスまでセット販売』してるからなんだよね。住所・国籍・通貨・社会保障を個別契約（モジュール化）できるようにするオープンソースの『宇宙政府』プロトコルが面白い。  
> 🔗 `https://univgov.pages.dev/?utm_source=x&utm_medium=reply&utm_campaign=buzz_thread`」

### Pattern B: 政治批判・法律・行政バグのバズ
> **フック:**  
> 「今の法律って修正・バグ出ししにくい“神棚の仕様書”になってるのが問題。権力が書いた暫定仕様書として、オープンソースのコードみたいに修正・交換できるようにしようって提案論考。  
> 🔗 `https://univgov.pages.dev/articles/law-is-disposable?utm_source=x&utm_medium=reply&utm_campaign=qa_article`」

### Pattern C: AI・未来・テクノロジー・新社会システムのバズ
> **フック:**  
> 「国家を消滅させるんじゃなくて、単なる『互換レイヤー』に縮小する設計。領土も武力も奪わず、ネット上のモジュールとして並行稼働させる『宇宙政府 v2』。  
> 🔗 `https://univgov.pages.dev/?utm_source=x&utm_medium=reply&utm_campaign=buzz_thread`」

---

## 3. Discord（飲酒鯖）・LINEオープンチャット用コピー

チャットコミュニティでは、「過度な連続投稿」を避け、雑談の波に乗って投下するのが効果的です。

### Discord 飲酒サーバー用（酒の魚・雑談ネタ）
> 「酒飲みながら政治や制度の愚痴言うのもあれだけど、国籍と住所を切り離してサブスクみたいに選べる『宇宙政府』ってプロジェクト、論考が普通に骨太で酒のつまみに最高だから読んでみてほしい笑  
> 🔗 `https://univgov.pages.dev/?utm_source=discord&utm_medium=drink_server`」

### LINEオープンチャット用（社会派・生活系）
> 「制度や法律って一度決まると変えにくいですが、『国家を運命から選べる部品にする』という非領土型の市民プロトコル試案サイトが参考になりました。Q&Aがかなり現実的で面白いです。  
> 🔗 `https://univgov.pages.dev/articles/questions-and-objections?utm_source=line_oc&utm_medium=chat`」

---

## 4. リアル飲み会・オフ会用プレゼン手順

リアル飲み会では**専用特設ページ `/nomi`** を活用します。

### ステップ 1: 酒席での話題の振り方
- **きっかけ文句:**  
  「ねえ、もし『住む場所はそのままで、税金や年金の所属先だけ別の国を選べる』としたらどうする？」
- **相手が「そんなのできるの？」と食いついたら:**  
  「宇宙政府っていうオープンソースの制度試案があるんだけど、スマホで30秒で読めるやつ見せるわ」

### ステップ 2: スマホ画面またはQRコードを差し出す
1. スマホで `https://univgov.pages.dev/nomi` を開く。
2. 画面トップの大きな「国家を『選べる部品』にする。」とQRコードを見せる。
3. 相手のスマホでQRコードを読み取ってもらう（これで `utm_source=real_nomi` アクセスが記録されます）。

### ステップ 3: 定番ツッコミへの返し
- **「宇宙政府って宗教？」**  
  →「真逆！教祖も土地も作らない。法律をオープンソースコードみたいにバグ修正できるようにするプロジェクトだよ」
- **「法律や税金はどうするの？」**  
  →「住所ごとの最小限のルールだけ残して、社会保障や通貨は選択制にする設計。Q&Aページに全部書かれてるよ」

---

## 5. 効果検証（アクセス解析のチェック）

宣伝を行った後は、Cloudflare Web Analytics の管理画面で以下の項目を確認します。

1. **`utm_source` 別の流入数:** `x`, `discord`, `line_oc`, `real_nomi` のどこから一番人が来ているか。
2. **滞在時間・閲覧ページ:** ぶら下げリプから来た人が `/articles/questions-and-objections` を読んでいるか。
3. **最もコンバージョン（巡回）が高い文言**を特定し、その投稿スタイルに集中的にリソースを投下する。
