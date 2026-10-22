export const site = {
  name: "宇宙政府 (UNIVGOV)",
  shortName: "宇宙政府",
  baseUrl: "https://univgov.pages.dev",
  ogImageDefault: "/assets/univgov-logo.jpg",
  author: "UNIVGOV 宇宙政府市民プロジェクト",
  twitterHandle: "@univgov",
  discordUrl: "https://discord.gg/ESZZCbUUwK",
  githubUrl: "https://github.com/biones/univgov",
  cloudflareAnalyticsToken: process.env.CF_ANALYTICS_TOKEN || "",
  googleAnalyticsId: process.env.GA_MEASUREMENT_ID || "G-TRJKZVLTEF",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "698222404877-286s6s3946n8rkqq3ihucsdogsq14pdo.apps.googleusercontent.com",
  googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION || "",
};

export const i18n = {
  ja: {
    lang: "ja",
    localeTag: "ja_JP",
    tagline: "国家の強制抱き合わせ（税・司法・通貨）を解体し「選択・退出」可能にする市民OS",
    description: "【宇宙政府 (UNIVGOV) 公式】「投票に行かないなら文句言うな」「税金が高いのに還元がない」という制度的理不尽を解体。住所・国籍・通貨・司法・行政サービスの強制抱き合わせを排し、検証・選択・退出（EXIT）できる非領土型モジュール統治プロトコル。",
    keywords: "宇宙政府, UNIVGOV, 投票 行かない 文句, 税金 高すぎる, 選挙 意味ない, 銀行 手数料 高い, 固定資産税 なぜ払う, 悪法 守る義務, ネットワークステート, 非領土国家, 退出権, ビットコイン, 制度設計",
    nav: {
      home: "ホーム",
      guide: "はじめての方へ",
      articles: "論考",
      rules: "七原則",
      spaceLaw: "宇宙法",
      github: "GitHub (宇宙法典)",
      parliament: "宇宙議会 (Discord)",
      portal: "マイポータル",
      search: "検索"
    },
    ui: {
      searchPlaceholder: "キーワードを入力",
      top: "トップへ ↑",
      read: "読む ↗",
      backToArticles: "← 論考一覧へ",
      toc: "このページの内容",
      body: "本文",
      end: "ここまで",
      readMore: "ほかの論考を読む →",
      notFound: "軌道から外れました。",
      notFoundDesc: "指定されたページは存在しないか、別の座標へ移動しました。",
      backHome: "ホームへ戻る →",
      latestSectionTitle: "新着・注目の論考",
      latestSectionSub: "国家の強制・独占・欺瞞を解体する最新の制度設計ノート。",
      latestBadge: "🔥 最新論考",
      viewAllArchive: "すべての論考（全11編）と宇宙法典を見る ↓",
      principlesTitle: "宇宙政府の七原則",
      principlesSub: "新しい権威を作るのではなく、システムが肥大化しない設計ルールを先に決める。",
      featuredTitle: "宇宙政府の最新記録",
      featuredSub: "アイデアを宣言で終わらせず、動くシステムへ変えるための最新ノート。",
      archiveTitle: "宇宙政府の文書と記録",
      archiveFilter: "記事を絞り込む",
      spaceLawTitle: "宇宙法典 全15条（Gitモジュール法規）",
      spaceLawSub: "国家の強制抱き合わせを解体し、ノージック、オストロム、ハイエク、カントの思想を結集した非領土型Gitネイティブ法典。各条文へピンポイントでPR・Issue・Forkが可能。",
      spaceLawViewArticle: "条文を読む ↗",
      spaceLawViewGithub: "GitHubで編集・PR ↗",
      aiToolkitTitle: "Gemini / AI政策監査プロンプトキット",
      aiToolkitSub: "高度な推論AI（Gemini等）を『パーソナルAI官僚・政策監査官』として活用し、公金調達・補助金・法案の危害性を即座に審査・自動化する実践プロンプト集。",
      aiPromptCopy: "プロンプトをコピー",
      aiPromptCopied: "コピーしました！",
      aiContextCopy: "AI用 全文コンテキスト (univgov_all.md) をコピー",
      registerTitle: "無料で登録する（Googleアカウントで1分）",
      registerDesc: "Googleアカウントでログインするだけで登録できます。新しいパスワードは不要です。登録しても何の義務もなく、やめたいときはマイページのボタン一つで、登録したデータを全部消せます。登録した方には、サイト内で使える練習用のお金「100万UNI」が配られます（お金を払う必要はありません）。",
      registerFormName: "識別名（氏名・エイリアス）",
      registerFormEmail: "メールアドレス",
      registerFormSubmit: "Googleでログイン / 宇宙国民証を発行",
      registerSuccess: "認証が完了しました。マイポータルへ移動します...",
      declarationTitle: "許可のいらない、市民性。",
      declarationDesc: "参加も退出も自由。ほかのコミュニティと併用できる、開かれた所属の仕組み。",
      joinParliament: "宇宙議会（Discord）に参加する ↗",
      parliamentTitle: "分散型パブリック宇宙議会 (X × Discord)",
      parliamentSub: "誰の許可もいらない。オープンなSNS上で法案を提起し、ハッシュタグで議論・集計する透明な統治プロトコル。",
      parliamentXTitle: "X（旧Twitter）公開議会プロトコル",
      parliamentXDesc: "議論の散逸や表記揺れを防ぐため、以下の標準ハッシュタグを採用しています。ボタンからワンクリックでタグ付き議案・意見を提出できます。",
      parliamentTagGeneral: "#UNIVGOV",
      parliamentTagBill: "#UNIVGOV_BILL",
      parliamentTagVote: "#UNIVGOV_VOTE",
      parliamentPostBill: "Xで法案・政策を提出する ↗",
      parliamentPostOpinion: "Xで議会に意見を投稿する ↗",
      parliamentSearch: "Xでリアルタイム議論を見る (#UNIVGOV) ↗",
      btcZoneTitle: "宇宙通貨 UNI ＆ ビットコイン生活圏",
      btcZoneSub: "理念だけで終わらせない。初期分配金 1,000,000 UNI（固定供給）の受取・送金から、BTC給与受取・近所のスーパーでの日用品決済まで、今すぐ生活を国家通貨からEXITする実践プロトコル。",
      manifestoTitle: "国家と戦うより、<br><em>もっと使えるシステム</em>を実装する。",
      heroKicker: "宇宙政府（UNIVGOV）は、インターネット上の市民グループです",
      heroTitle: "住む場所はそのまま。<br><span>国の仕組みを、少しずつ選べるように。</span>",
      heroLead1: "お金、ルール、身分証明、役所のサービス。今はこれらを、生まれた国が「全部セット」で決めています。合わない部分があっても、その部分だけを取り替えることはできません。",
      heroLead2: "宇宙政府は、今の家に住んだまま、その一部を自分で選べるようにする方法を考え、インターネット上で小さく試しています。国と戦ったり、土地を奪ったり、お金を集めたりはしません。",
      heroRegisterBtn: "🪐 無料で登録してみる",
      heroExplainBtn: "📖 はじめての方へ（やさしい解説・5分）",
      heroGuideNote: "※「宇宙」はロケットとは関係なく、「特定の国や土地に縛られない」という意味です。",
      readPrinciples: "七原則を読む",
      readArticles: "論考一覧へ",
      readManifesto: "百年仮説を読む ↗",
      readDeclaration: "宇宙国民宣言を読む ↗",
      shareOnX: "𝕏 でポスト",
      shareOnBluesky: "Bluesky",
      shareOnLine: "LINE",
      shareCopyUrl: "URLをコピー",
      shareUrlCopied: "コピー完了！",
      nativeShare: "共有",
      articleRegisterCtaTitle: "国家の抱き合わせから、今すぐEXITする第一歩。",
      articleRegisterCtaDesc: "Googleワンクリックであなたのデジタル宇宙国民証を発行。面倒なパスワードは不要で、初期資金 1,000,000 UNI が即時付与されます。いつでもワンクリックで全データ抹消・完全退出（EXIT）可能です。",
      articleRegisterCtaBtn: "🪐 Googleで宇宙国民証を発行する（100万UNI受取）",
      langSwitcher: "EN",
      langLink: "/en/",

      // ひとことで言うと（やさしい説明）
      explainTitle: "宇宙政府って、なに？",
      explainSub: "むずかしい言葉は使わずに説明します。",
      explainOneLiner: "今の家に住んだまま、国が「全部セット」で決めているもののうち、いくつかを自分で選べるようにしたい。そのための実験を、インターネット上でやっているグループです。",
      explainIntro1: "たとえば携帯電話の料金プランで「通話もネットも保険も全部セット。一つだけ解約はできません。嫌なら会社ごと乗り換えてください」と言われたら、不便ですよね。今の国の仕組みは、これに少し似ています。",
      explainIntro2: "宇宙政府は、今の国の仕組みを壊すのではなく、そのまま使いながら「もう一つの選択肢」を横に用意しておく、という考え方です。日本の法律や税金は、これまでどおりです。",
      explainLegacyTag: "いまの国の仕組み",
      explainLegacyTitle: "生まれた国が「全部セット」で決める",
      explainLegacy1: "お金・法律・年金・健康保険・役所のサービスが、ひとまとめになっている",
      explainLegacy2: "合わない部分があっても、その部分だけを取り替えることはできない",
      explainLegacy3: "選べるのは「選挙で一票」か「海外に引っ越す」くらい",
      explainUnivgovTag: "宇宙政府がめざすこと",
      explainUnivgovTitle: "住む場所はそのままで、一部を選べるように",
      explainUnivgov1: "今の家・今の国籍のまま、インターネット上で別のルールや助け合いの仕組みに参加できる",
      explainUnivgov2: "いくつかの仕組みを比べて、自分に合うものを選んだり、組み合わせたりできる",
      explainUnivgov3: "合わなければ、いつでもボタン一つでやめられる（登録データも全部消せる）",
      explainGuideLink: "📖 もっとくわしく：完全入門を読む（約8分） →",

      // 入門バナー（3分で完全にわかる宇宙政府）
      guideBannerBadge: "🔥 まず最初に読んでほしい基幹記事",
      guideBannerTitle: "【完全入門】「宇宙政府（UNIVGOV）」とは何か？",
      guideBannerSub: "「国」という解約不能なボッタクリ契約から、自分の人生と資産を取り戻す方法",
      guideBannerDesc: "「怪しい宗教？」「結局何がしたいの？」「選挙や海外移住と何が違う？」を専門用語ゼロで徹底解説。選挙の責任転嫁トラップ、5つの具体的武器、Google登録の理由と完全EXIT権まで、これ1本で全貌が分かります。",
      guideBannerBtn: "📖 3分で完全にわかる宇宙政府のすべて を読む →",

      // 第1章〜第5章ハイライト
      chaptersTitle: "5つの章でわかる宇宙政府の核心",
      chaptersSub: "タップすると各章のポイントが開きます。詳しく知りたい方は完全入門記事へどうぞ。",
      chapters: [
        {
          num: "第1章",
          title: "いまの「国」は、解約できないボッタクリのスマホ契約と同じである",
          summary: "生まれた瞬間、住む場所・インフラ・通貨・資格・年金・選挙・愛国心が「全部セット」で強制加入させられます。宇宙政府はこれをバラ売りにし、「必要なインフラだけ使い、不要なボッタクリは解約（EXIT）して、自由に乗り換えよう」と提案します。"
        },
        {
          num: "第2章",
          title: "「文句があるなら選挙に行け」「嫌なら日本から出ていけ」という嘘",
          summary: "投票しても棄権しても国が無罪放免になる「責任転嫁トラップ（イカサマカジノ）」。腐ったラーメン屋の店主と殴り合うのではなく、「黙って席を立って別の美味い店へ行く（EXIT）」のが賢い選択です。土地への愛着と、役所への忠誠は別物です。"
        },
        {
          num: "第3章",
          title: "「ルールと土地は分けられない」「独裁国家はどうする？」への回答",
          summary: "道路や警察などの物理ルールは現地の国に任せ、お金・契約・信用・心の国籍だけを切り離します。日本国を「神聖な祖国」から「道路・水道の保守管理業者（有料下請けベンダー）」へ心の中で格下げし、インフラだけ使い倒します。"
        },
        {
          num: "第4章",
          title: "宇宙政府（UNIVGOV）が実際に提供する「5つの武器」",
          summary: "①心の国籍「宇宙国民宣言」、②100万UNIの無条件配布＆Bitcoin、③税金のムダ遣いを暴く「政策評価カード」、④お上の免許に頼らない実績証明、⑤Gitで管理し平和的に分裂（フォーク）できる宇宙法。"
        },
        {
          num: "第5章",
          title: "なぜ最初はGoogleアカウントで登録するの？ 本当にいつでもやめられる？",
          summary: "最初から純粋主義に陥らず誰でも参加できる現実的3段階移行。そしてマイポータルには「ワンクリックで全データを完全消去して即座に脱退できるボタン」を標準装備。入るときよりやめるときのほうが簡単です。"
        }
      ],

      // よくある疑問（FAQ）
      faqSectionTitle: "よくある心配ごと",
      faqSectionSub: "「宇宙政府」という名前に驚かれるかもしれません。よく聞かれることにお答えします。",
      faq1Q: "あやしい団体ではないの？ 土地を占拠したりするの？",
      faq1A: "いいえ。土地の占拠や、武力で独立するようなことは一切しません。今の家・今の職場のまま、インターネット上で参加するだけです。",
      faq2Q: "お金を取られたり、投資を勧められたりしない？",
      faq2A: "ありません。会費・寄付の強制・投資の勧誘・ネット上の通貨の販売などは一切なく、完全に無料です。",
      faq3Q: "国と戦ったり、法律を無視したりするの？",
      faq3A: "いいえ、戦いません。今の法律の範囲内でできる「もう一つの選択肢」を作り、より良いルールを提案していく活動です。",
      faq4Q: "参加すると、日本の税金を払わなくてよくなるの？",
      faq4A: "いいえ。日本に住んでいる限り、日本の法律や税金はこれまでどおりです。登録しても、それは変わりません。",
      faq5Q: "「100万UNI」って何？ もらって大丈夫？",
      faq5A: "UNI（ユニ）は、このサイトの中だけで使える「練習用のお金」です。ポイントのようなもので、お金を払って買うものではなく、今のところ日本円に換える仕組みもありません。",

      // 用語ミニ辞典
      glossaryTitle: "よく出てくる言葉の意味",
      glossarySub: "サイトの中でよく出てくる言葉を、かんたんに説明します。",
      glossary: [
        ["宇宙国民", "宇宙政府に登録した人のこと。日本国籍をやめるわけではなく、「もう一つ所属先を持つ」イメージです。"],
        ["EXIT（イグジット）", "「やめる・出ていく」こと。いつでも自由にやめられることを、とても大事にしています。"],
        ["モジュール", "「取り替えられる部品」のこと。国の仕組みを部品のように分けて選べるようにしたい、という意味です。"],
        ["宇宙法典", "宇宙政府の中で使うルール集。日本の法律の代わりになるものではありません。"],
        ["論考", "考えをまとめた文章（記事）のことです。"],
        ["Discord（ディスコード）", "誰でも参加できる、インターネット上の話し合いの場（チャットのアプリ）です。"],
      ],

      // 今日からできること
      stepsTitle: "まず何をすればいい？",
      stepsSub: "どれか一つだけで十分です。どれも無料で、あとから取り消せます。",
      step1Num: "01",
      step1Tag: "読む（5分）",
      step1Title: "やさしい解説を読む",
      step1Desc: "専門用語なしで、宇宙政府が何をしたいのかをまとめたページです。まずはここからどうぞ。",
      step1Link: "はじめての方へ を読む →",
      step2Num: "02",
      step2Tag: "登録する（1分）",
      step2Title: "無料で登録してみる",
      step2Desc: "Googleアカウントがあれば、ボタン一つで登録できます。何の義務もなく、いつでもボタン一つで全部消せます。",
      step2Link: "登録の場所へ ↓",
      step3Num: "03",
      step3Tag: "のぞく",
      step3Title: "話し合いをのぞいてみる",
      step3Desc: "Discord（チャットのアプリ）で、どんな話し合いがされているか見てみましょう。見るだけでもかまいません。",
      step3Link: "Discordをのぞく ↗",

      // もっと詳しく（折りたたみ）
      moreTitle: "もっと詳しく知りたい方へ",
      moreSub: "ここから先は、考え方の詳細・ルール集（宇宙法典）・記事の一覧・ビットコインやAIを使った実践など、関心のある方向けの内容です。",
      moreOpen: "▼ 詳しい内容を開く（記事一覧・七原則・宇宙法典・議会・ビットコイン・AIキット）",
    },
    principles: [
      ["01", "所属先を選ぶ", "生まれた場所を、心の所属先に固定しない。複数所属も無所属もOK。"],
      ["02", "土地を支配しない", "土地や武力を、正しさの証明に使わない。"],
      ["03", "強制は最小限", "具体的な危害を止める以上の強制を増やさない。"],
      ["04", "機能を分ける", "通貨、資格、福祉、教育、認証をモジュールとして切り分ける。"],
      ["05", "効果を公開する", "目的、コスト、効果、代替案、失敗条件をオープンにする。"],
      ["06", "乗り換え可能にする", "参加だけでなく、EXITとデータ移行を最初から設計する。"],
      ["07", "だめなら戻す", "小さくテストし、期限を決め、失敗したらロールバックする。"],
    ]
  },
  en: {
    lang: "en",
    localeTag: "en_US",
    tagline: "Turning the State into Selectable Components: A Non-Territorial Modular Governance Protocol",
    description: "Turning the state from a fate into selectable components. A civic OS to select, verify, and exit governance functions. UNIVGOV is a project proposing verifiable, exit-able systems by unbundling allegiance, currency, credentials, welfare, and political participation.",
    keywords: "UNIVGOV, Universe Government, Network State, Cosmic Currency, UNI, Non-territorial governance, unbundled state, exit rights, verifiable policy, decentralized governance, post-national society, Cosmic Parliament, Bitcoin",
    nav: {
      home: "Home",
      guide: "New Here?",
      articles: "Articles",
      rules: "Principles",
      spaceLaw: "Space Law",
      github: "GitHub (Law Code)",
      parliament: "Cosmic Parliament (Discord)",
      portal: "My Portal",
      search: "Search"
    },
    ui: {
      searchPlaceholder: "Type keywords...",
      top: "Back to top ↑",
      read: "Read ↗",
      backToArticles: "← Back to Articles",
      toc: "On this page",
      body: "Content",
      end: "End of document",
      readMore: "Read more articles →",
      notFound: "Off course.",
      notFoundDesc: "The page you are looking for does not exist or has been moved.",
      backHome: "Back to Home →",
      latestSectionTitle: "Latest & Featured Essays",
      latestSectionSub: "Deconstructing coercion, monopolies, and institutional myths through selectable protocols.",
      latestBadge: "🔥 NEW ESSAY",
      viewAllArchive: "View All 11 Essays & Space Law Code ↓",
      principlesTitle: "Seven Principles",
      principlesSub: "We don't create new authorities; we set design rules to prevent system bloat.",
      featuredTitle: "Latest Records",
      featuredSub: "Notes to turn ideas from manifestos into working systems.",
      archiveTitle: "Documents and Records",
      archiveFilter: "Filter articles",
      spaceLawTitle: "Minimal Space Law Code (15 Modular Articles)",
      spaceLawSub: "A Git-native legal system unbundling state monopolies, derived from Nozick, Ostrom, Hayek, and Kant. Submit PRs and Issues directly to any article.",
      spaceLawViewArticle: "Read Article ↗",
      spaceLawViewGithub: "Edit on GitHub ↗",
      aiToolkitTitle: "Gemini / AI Governance Prompt Kit",
      aiToolkitSub: "Empower frontier reasoning AI as your personal civic auditor. Analyze municipal budgets, audit subsidies, and test bill paternalism against SLMP-1 standards.",
      aiPromptCopy: "Copy Prompt",
      aiPromptCopied: "Copied!",
      aiContextCopy: "Copy Context (univgov_all.md)",
      registerTitle: "Cosmic Citizen Account (Google One-Click Auth)",
      registerDesc: "Sign in with your Google account to issue your Cosmic Citizen ID and access My Portal instantly with zero password management. Includes an automatic initial grant of 1,000,000 UNI (fixed supply, bootstrapping allocation). Free to join and full 1-click EXIT anytime.",
      registerFormName: "Identifier / Full Name",
      registerFormEmail: "Email Address",
      registerFormSubmit: "Sign in with Google / Issue Citizen ID",
      registerSuccess: "Authentication successful. Redirecting to My Portal...",
      declarationTitle: "Citizenship Without Permission.",
      declarationDesc: "Free to join, free to exit. An open affiliation compatible with other communities.",
      joinParliament: "Join Cosmic Parliament (Discord) ↗",
      parliamentTitle: "Decentralized Public Parliament (X × Discord)",
      parliamentSub: "No permission needed. Propose bills and deliberate transparently on open social platforms with normalized hashtags.",
      parliamentXTitle: "X (Twitter) Public Deliberation Protocol",
      parliamentXDesc: "To prevent fragmentation and typo variances, we define standard normalized hashtags. Submit bills and arguments with one click.",
      parliamentTagGeneral: "#UNIVGOV",
      parliamentTagBill: "#UNIVGOV_BILL",
      parliamentTagVote: "#UNIVGOV_VOTE",
      parliamentPostBill: "Propose a Bill on X ↗",
      parliamentPostOpinion: "Submit Opinion on X ↗",
      parliamentSearch: "View Live Discussions on X (#UNIVGOV) ↗",
      btcZoneTitle: "Cosmic Currency UNI & Bitcoin Living Zone",
      btcZoneSub: "Beyond mere philosophy. From 1,000,000 UNI initial grant & P2P transfers to BTC salary and grocery spending, actionable protocols to exit state fiat currencies now.",
      manifestoTitle: "Instead of fighting the state,<br>implement a <em>more usable system</em>.",
      heroKicker: "UNIVGOV is an online citizens' group",
      heroTitle: "Keep your address.<br><span>Choose parts of how you're governed.</span>",
      heroLead1: "Money, rules, ID, public services: today your birth country decides all of these as one package. If one part doesn't suit you, you can't swap out just that part.",
      heroLead2: "UNIVGOV explores ways to let you choose some of these parts without moving, and tests them in small online experiments. We don't fight governments, seize land, or collect money.",
      heroRegisterBtn: "🪐 Register for free",
      heroExplainBtn: "📖 New here? (plain guide, 5 min)",
      readPrinciples: "Read the Principles",
      readArticles: "All Articles",
      readManifesto: "Read the Hundred-Year Thesis ↗",
      readDeclaration: "Read the Citizen Declaration ↗",
      shareOnX: "Post on 𝕏",
      shareOnBluesky: "Bluesky",
      shareOnLine: "LINE",
      shareCopyUrl: "Copy URL",
      shareUrlCopied: "Copied!",
      nativeShare: "Share",
      articleRegisterCtaTitle: "Take the First Step to EXIT the Bundled State.",
      articleRegisterCtaDesc: "Issue your Digital Cosmic Citizen ID with 1-click Google authentication. Zero password hassles, automatic 1,000,000 UNI initial grant, and 1-click permanent data erasure anytime.",
      articleRegisterCtaBtn: "🪐 Issue Cosmic ID with Google (10⁶ UNI Grant)",
      langSwitcher: "JA",
      langLink: "/",
      heroGuideNote: "* \"Universe\" has nothing to do with rockets. It means \"not tied to any particular country or land.\"",

      // Plain explainer
      explainTitle: "What is UNIVGOV?",
      explainSub: "Explained without jargon.",
      explainOneLiner: "We want people to be able to choose some of the things their country decides for them as a single package, without having to move. We are an online group running small experiments toward that goal.",
      explainIntro1: "Imagine a phone plan that says: \"Calls, data, and insurance are one package. You can't cancel just one. If you don't like it, switch carriers entirely.\" That's inconvenient, and today's state works a bit like that.",
      explainIntro2: "UNIVGOV doesn't try to tear down existing systems. We keep using them while building \"another option\" alongside. Your country's laws and taxes stay exactly as they are.",
      explainLegacyTag: "How it works today",
      explainLegacyTitle: "Your birth country decides everything as one package",
      explainLegacy1: "Money, laws, pensions, health insurance, and public services all come bundled",
      explainLegacy2: "Even if one part doesn't suit you, you can't swap out just that part",
      explainLegacy3: "Your only options are voting or moving abroad",
      explainUnivgovTag: "What UNIVGOV aims for",
      explainUnivgovTitle: "Stay where you live, choose some of the parts",
      explainUnivgov1: "Join different rules or mutual-aid systems online without changing your home or nationality",
      explainUnivgov2: "Compare systems and pick or combine the ones that suit you",
      explainGuideLink: "📖 Read more: Complete Guide (approx. 8 min) →",

      // Guide banner
      guideBannerBadge: "🔥 Essential First Read",
      guideBannerTitle: "[Complete Guide] What is UNIVGOV?",
      guideBannerSub: "How to Reclaim Your Life and Wealth from the Non-Cancelable Monopoly of the State",
      guideBannerDesc: "An all-in-one introductory essay free of jargon: dismantling the state as a forced bundle, debunking the election accountability trap, 5 practical tools, and the guarantee of 1-click total EXIT.",
      guideBannerBtn: "📖 Read the Complete Guide to UNIVGOV →",

      // 5 Chapters Highlights
      chaptersTitle: "The Core of UNIVGOV in 5 Chapters",
      chaptersSub: "Tap any chapter to expand the summary, or read the complete guide above.",
      chapters: [
        {
          num: "Chapter 1",
          title: "The Modern State is an Overpriced, Non-Cancelable Telecom Bundle",
          summary: "At birth, you are forced into a monolithic bundle combining land, money, infrastructure, licenses, pensions, and mandatory patriotism. UNIVGOV unbundles this: keep the physical utility, cancel the predatory options, and choose parallel alternatives."
        },
        {
          num: "Chapter 2",
          title: "The Two Falsehoods: 'Just Vote or Run' and 'If You Don't Like It, Leave'",
          summary: "A rigged casino where whether you vote or abstain, the state apparatus is never blamed. When soup is rotten, you don't fight the cook; you quietly walk over to a better shop (EXIT). Love of land is not allegiance to government."
        },
        {
          num: "Chapter 3",
          title: "Answering Objections: Can Land and Rules Really Be Separated?",
          summary: "Leave physical traffic and violent crime to local host states; unbundle money, contracts, credentials, and mental allegiance. Downgrade the state in your mind from a sacred homeland to an external utility contractor for roads and water."
        },
        {
          num: "Chapter 4",
          title: "5 Practical Tools UNIVGOV Actually Provides",
          summary: "1) Cosmic Citizen Declaration & My Portal, 2) 1,000,000 UNI Grant & Bitcoin integration, 3) Policy Evaluation Cards exposing subsidy cartels, 4) Verifiable Proof-of-Work Credentials, 5) Git-managed Space Law with guaranteed peaceful forking."
        },
        {
          num: "Chapter 5",
          title: "Why Start with Google Sign-in? Can I Really Leave Anytime?",
          summary: "Pragmatic 3-stage onboarding without elitist purity spirals. And unlike states, My Portal guarantees a prominent 1-click button to export your records and permanently erase all account data anytime."
        }
      ],

      // FAQ
      faqSectionTitle: "Common Worries",
      faqSectionSub: "The name may sound strange. Here are answers to the questions we hear most.",
      faq1Q: "Is this a sketchy group? Do you occupy land?",
      faq1A: "No. We never occupy land or declare independence by force. You simply participate online from wherever you live.",
      faq2Q: "Will you ask me for money or pitch investments?",
      faq2A: "Never. No fees, no mandatory donations, no investment pitches, no token sales. It's completely free.",
      faq3Q: "Do you fight governments or ignore the law?",
      faq3A: "No. We build \"another option\" within existing law and propose better rules.",
      faq4Q: "If I join, do I stop paying taxes?",
      faq4A: "No. As long as you live in your country, its laws and taxes apply as before. Registering changes nothing about that.",
      faq5Q: "What is \"1,000,000 UNI\"?",
      faq5A: "UNI is a practice currency that only works inside this site, like loyalty points. You never pay for it, and there is currently no way to exchange it for real money.",

      // Glossary
      glossaryTitle: "Words You'll See Here",
      glossarySub: "Quick definitions of terms used across the site.",
      glossary: [
        ["Cosmic citizen", "A registered member. You don't give up your nationality; it's an additional affiliation."],
        ["EXIT", "Leaving. Being free to leave anytime is one of our core values."],
        ["Module", "A swappable part. We want state functions to become parts you can choose."],
        ["Space Law Code", "The rulebook used inside UNIVGOV. It does not replace your country's laws."],
        ["Articles", "Essays explaining our ideas."],
        ["Discord", "An online chat app where anyone can join discussions."],
      ],

      // Steps
      stepsTitle: "Where Do I Start?",
      stepsSub: "Just one of these is enough. All free, all reversible.",
      step1Num: "01",
      step1Tag: "Read (5 min)",
      step1Title: "Read the plain guide",
      step1Desc: "A jargon-free page explaining what UNIVGOV wants to do. Start here.",
      step1Link: "Read \"New Here?\" →",
      step2Num: "02",
      step2Tag: "Register (1 min)",
      step2Title: "Register for free",
      step2Desc: "One click with a Google account. No obligations, and you can delete everything with one button.",
      step2Link: "Go to registration ↓",
      step3Num: "03",
      step3Tag: "Look around",
      step3Title: "Peek into the discussion",
      step3Desc: "See what people are talking about on Discord. Just watching is fine.",
      step3Link: "Open Discord ↗",

      // More (collapsible)
      moreTitle: "Want to Go Deeper?",
      moreSub: "Below: the detailed philosophy, the Space Law Code, all articles, and hands-on tools with Bitcoin and AI.",
      moreOpen: "▼ Show details (articles, principles, law code, parliament, Bitcoin, AI kit)",
    },
    principles: [
      ["01", "Choose Affiliation", "Do not fix your heart's affiliation to your birthplace. Multiple or no affiliations are OK."],
      ["02", "No Territorial Rule", "Do not use land or armed force to prove your righteousness."],
      ["03", "Minimize Coercion", "Do not increase coercion beyond stopping concrete harm."],
      ["04", "Unbundle Functions", "Separate currency, credentials, welfare, education, and authentication into modules."],
      ["05", "Publish Effectiveness", "Openly share objectives, costs, effects, alternatives, and failure conditions."],
      ["06", "Design for Portability", "Design for EXIT and data portability from the very beginning."],
      ["07", "Rollback on Failure", "Test small, set deadlines, and rollback if it fails."],
    ]
  }
};

export const articles = [
  {
    slug: "easy-guide",
    displayTitle: "【完全入門】「宇宙政府（UNIVGOV）」とは何か？ ――「国」という解約不能なボッタクリ契約から、自分の人生と資産を取り戻す方法",
    displayTitleEn: "[Complete Guide] What is UNIVGOV? ―― How to Reclaim Your Life and Wealth from the Monopoly of the State",
    source: "site/content/easy-guide.md",
    sourceEn: "site/content/en/easy-guide.md",
    label: "完全入門",
    labelEn: "Complete Guide",
    date: "2026-10-14",
    read: "約8分",
    readEn: "8 min read",
    accent: "cyan",
    featured: true,
    summary: "「怪しい宗教？」「結局何がしたいの？」「選挙や海外移住と何が違う？」を専門用語ゼロで徹底解説。解約不能なボッタクリ契約としての国家の解体、選挙の責任転嫁トラップ、5つの具体的武器、Google登録の理由と完全EXIT権まで、これ1本で全貌が分かる入門基幹論考。",
    summaryEn: "A complete jargon-free guide to UNIVGOV: dismantling the state as a mandatory telecom bundle, exposing the election responsibility trap, answering real-world objections, our 5 practical tools, and the guarantee of 1-click total EXIT."
  },
  {
    slug: "destruction-of-bullshit-jobs",
    displayTitle: "ブルシット・ジョブの完全解体――なぜ「すべての仕事は効果ゼロがデフォルト」であり、ホワイトカラーの9割はAIで代替可能なのか",
    displayTitleEn: "Deconstructing Bullshit Jobs: The 'Zero-Effect Default' Null Hypothesis and Why 90% of White-Collar Work Can Be Replaced by AI",
    source: "site/content/destruction-of-bullshit-jobs.md",
    sourceEn: "site/content/en/destruction-of-bullshit-jobs.md",
    label: "労働・制度解体",
    labelEn: "Labor Deconstruction",
    date: "2026-10-20",
    read: "約12分",
    readEn: "12 min read",
    accent: "orange",
    featured: true,
    summary: "ホワイトカラーの作業は政策や新薬と同じく「効果ゼロ（Δ=0）」をデフォルトとして立証責任を逆転せよ。飽和した現代において効果検証のない労働は全く尊敬の対象ではない。労働行為と成果の峻別、本社維持費の価格転嫁、AI時代に「仕事をなくすこと」と「人を困窮させること」を切り離す生産・分配プロトコル。",
    summaryEn: "Indirect white-collar tasks default to a zero-effect null hypothesis (Δ=0), just like new drugs and policies. In a saturated era, unverified labor commands zero respect. Distinguishing effort from outcomes and unbundling production from income distribution in the age of AI."
  },
  {
    slug: "banking-cartel-parasite",
    displayTitle: "なぜ銀行の振込手数料は不当に高いのか？公的インフラ独占と日銀・メガバンクの搾取構造を解体する",
    displayTitleEn: "Deconstructing Bank Rents: How Public Monopoly and Regulatory Barriers Manufacture Unearned Spreads",
    source: "site/content/banking-cartel-parasite.md",
    sourceEn: "site/content/en/banking-cartel-parasite.md",
    label: "金融構造解体",
    labelEn: "Financial Deconstruction",
    date: "2026-09-18",
    read: "約15分",
    readEn: "15 min read",
    accent: "orange",
    featured: true,
    summary: "日銀利上げでも預金金利が上がらない理由、臨時金利調整法による官製カルテル、リブラ圧殺の真相、カンティロン効果。銀行が「目利き」ではなく公的保護による制度的独占で暴利を貪るレントシーキング構造をデータサイエンスと経済学で厳密に解体する。",
    summaryEn: "Analyzing the lag in deposit betas under BOJ rate hikes, the Temporary Interest Rate Adjustment Law, the execution of Libra, the Cantillon effect, and how data science shatters the myth of bank screening expertise. A rigorous structural deconstruction."
  },
  {
    slug: "minimal-space-law-code",
    displayTitle: "宇宙政府 最小限必要法典（全20条）――国家の強制・選挙・司法独占を排したGitネイティブ法規範体系",
    displayTitleEn: "Minimal Space Law Code: 20 Core Norms Derived from Jurisprudence, Economics, and Philosophy",
    source: "site/content/minimal-space-law-code.md",
    sourceEn: "site/content/en/minimal-space-law-code.md",
    label: "宇宙法典",
    labelEn: "Legal Code",
    date: "2026-08-22",
    read: "約15分",
    readEn: "15 min read",
    accent: "purple",
    featured: true,
    summary: "近代国家の強制抱き合わせ（領土・軍事・選挙・司法・通貨）を解体。ロバート・ノージック、エリノア・オストロム、F.A.ハイエク、カントの法哲学・経済学を結集し、GitHub上でプルリクエストと反証テストにより運用される非領土型法典。",
    summaryEn: "A Git-native 20-article minimal legal code for space governance, synthesizing Robert Nozick, Elinor Ostrom, F.A. Hayek, and Immanuel Kant."
  },
  {
    slug: "vote-or-run-is-not-an-argument",
    displayTitle: "「投票に行かないなら文句言うな」はなぜ詭弁なのか？選挙の免責トラップとEXITの論理",
    displayTitleEn: "'Just Vote or Run' is Not an Argument",
    source: "site/content/vote-or-run-is-not-an-argument.md",
    sourceEn: "site/content/en/vote-or-run-is-not-an-argument.md",
    label: "制度解体",
    labelEn: "Deconstruction",
    date: "2026-08-19",
    read: "約12分",
    readEn: "12 min read",
    accent: "orange",
    featured: true,
    summary: "「文句があるなら投票に行け、嫌なら出馬しろ」という政治の巨大な責任転嫁トラップを完全解体。投票しても棄権しても国家側が無罪放免になる制度的イカサマの構造と、イカサマカジノを降りてEXIT（退出）する論理的正当性。",
    summaryEn: "Deconstructing the accountability-laundering trap of 'just vote or run'. Why we refuse to play a rigged game and choose EXIT instead."
  },
  {
    slug: "fiction-of-land-ownership",
    displayTitle: "固定資産税はなぜ毎年奪われるのか？「土地所有権」というフィクションの欺瞞と戦争の根源",
    displayTitleEn: "The Fiction of Land Ownership",
    source: "site/content/fiction-of-land-ownership.md",
    sourceEn: "site/content/en/fiction-of-land-ownership.md",
    label: "構造解体",
    labelEn: "Deconstruction",
    date: "2026-08-19",
    read: "約11分",
    readEn: "11 min read",
    accent: "orange",
    featured: true,
    summary: "人間が地面を「永遠に所有する」ことなど物理的には存在しない。軍事暴力による囲い込みを正当化し、永続的に地代・固定資産税を徴収するための法的フィクションを暴き、国家が戦争を引き起こす根本原因を解体する。",
    summaryEn: "Physical land ownership does not exist. It is a legal fiction legitimizing military enclosure, revealing why war is a built-in feature of states."
  },
  {
    slug: "state-as-paid-vendor",
    displayTitle: "税金が高すぎるのに還元がない根本原因――国家を「有料外部ベンダー」として評価・解約する思考法",
    displayTitleEn: "Downgrading the State to a Paid External Vendor",
    source: "site/content/state-as-paid-vendor.md",
    sourceEn: "site/content/en/state-as-paid-vendor.md",
    label: "第一段階",
    labelEn: "Stage 1",
    date: "2026-08-19",
    read: "約10分",
    readEn: "10 min read",
    accent: "orange",
    featured: true,
    summary: "国家は神聖な祖国ではなく、道路や水道を保守する有料外部業者にすぎない。高い税金を払いながら見返りのない行政に縛られるのをやめ、インフラだけを使い倒しながら資産・主権・信用を自衛・EXITする第一段階プロトコル。",
    summaryEn: "The state is not a sacred fatherland, but an external utility vendor for roads and water. Use the physical infrastructure while migrating sovereignty and wealth via Bitcoin and multi-sig."
  },
  {
    slug: "practical-exit-protocol",
    displayTitle: "税金と社会保険料の搾取から合法的に距離を置く実践手順――公金利権・国家依存から抜け出すEXITプロトコル",
    displayTitleEn: "Practical EXIT Protocol: Boycotting the Cartel",
    source: "site/content/practical-exit-protocol.md",
    sourceEn: "site/content/en/practical-exit-protocol.md",
    label: "実践プロトコル",
    labelEn: "Action Protocol",
    date: "2026-08-18",
    read: "約8分",
    readEn: "8 min read",
    accent: "cyan",
    featured: true,
    summary: "国家カルテルはすぐには倒せないが、個人が今すぐ距離を置くことはできる。「公金利権・補助金ビジネスの徹底的無視（ボイコット）」と「暗号資産・分散プロトコルによる通貨・信用の退避」により、国家搾取から生活を守る具体的アクション。",
    summaryEn: "The state cartel won't vanish overnight. A practical guide to immediate individual action: boycotting subsidized cartels and migrating wealth/trust to Bitcoin."
  },
  {
    slug: "state-military-zaibatsu",
    displayTitle: "なぜ政治と大企業・メガバンクは癒着し続けるのか？東インド会社から続く「国家・軍隊・財閥の鉄の三角形」",
    displayTitleEn: "The Trinity of State, Military, and Zaibatsu",
    source: "site/content/state-military-zaibatsu.md",
    sourceEn: "site/content/en/state-military-zaibatsu.md",
    label: "構造解体",
    labelEn: "Deconstruction",
    date: "2026-08-18",
    read: "約12分",
    readEn: "12 min read",
    accent: "orange",
    featured: true,
    summary: "東インド会社から明治維新、現代の天下り・メガバンク・総合商社まで、国家権力と巨大資本が不可分に結託してきた歴史的構造を暴く。一般市民が税金として吸い上げられ続ける「鉄の三角形」の正体と、そのカルテルから離脱するための制度設計。",
    summaryEn: "Why the state cannot sever ties with megabanks and trading conglomerates. From the East India Companies to modern iron triangles, we deconstruct the cartel and present the protocol for EXIT."
  },
  {
    slug: "stress-test",
    displayTitle: "宇宙政府の「11の弱点」を自ら徹底破壊する――敵対的ストレステストとAI批判への設計応答",
    displayTitleEn: "Breaking Univgov Ourselves: Eleven Weaknesses and Design Responses",
    source: "site/content/stress-test.md",
    sourceEn: "site/content/en/stress-test.md",
    label: "自己検証",
    labelEn: "Self-Audit",
    date: "2026-08-10",
    read: "約20分",
    readEn: "20 min read",
    accent: "orange",
    featured: true,
    summary: "理想論を語る前に自らを攻撃せよ。先端推論AI（Claude Sonnet、Qwen、DeepSeek等）に宇宙政府の制度的欠陥を全力で突かせ、乗っ取りリスク、代替案不在、防衛力不足など11の脆弱性に対する具体的な防衛・修正パッチを公開検証。",
    summaryEn: "A stress test of Univgov's claims using its own criteria of 'verifiability' and 'exitability'. Design responses to Sonnet 5, Qwen, and DeepSeek critiques."
  },
  {
    slug: "questions-and-objections",
    displayTitle: "【徹底反論Q&A】宇宙政府への現実的な疑問と批判に全て答える（治安・税・司法・通貨・福祉）",
    displayTitleEn: "Answering Objections to Univgov",
    source: "drafts/2026-07-30_宇宙政府_QandA.md",
    sourceEn: "drafts/en/2026-07-30_univgov_qanda.md",
    label: "Q&A",
    labelEn: "Q&A",
    date: "2026-07-30",
    read: "約18分",
    readEn: "18 min read",
    accent: "violet",
    featured: true,
    summary: "「警察や防衛はどうする？」「税金を取らずに公共インフラをどう維持する？」「絵空事・カルトではないのか？」法、税、地域、民主制、通貨、資格、福祉、運営。宇宙政府に向けられるあらゆる反論から逃げずに正面突破で論理的に答える。",
    summaryEn: "Law, taxes, local community, democracy, currency, credentials, welfare, operations. We tackle all objections directly."
  },
  {
    slug: "law-is-disposable",
    displayTitle: "「悪法でも法律だから守れ」はおかしい――理不尽な法律の自動失効（サンセット）とGit的法改正",
    displayTitleEn: "From the Altar to the Trash Can: Law is Disposable",
    source: "site/content/law-is-disposable.md",
    sourceEn: "site/content/en/law-is-disposable.md",
    label: "制度批判",
    labelEn: "Critique",
    date: "2026-07-30",
    read: "約9分",
    readEn: "9 min read",
    accent: "orange",
    featured: true,
    ogImage: "law-is-disposable-og.png",
    summary: "法律は絶対的正義でも民意でもない。権力が書いた「暫定仕様書」にすぎない。一度作られた法律が利権化して永続する構造を暴き、神棚から降ろして賞味期限（自動失効）と反証可能性テストによるGit的修正・廃棄・交換サイクルを確立する。",
    summaryEn: "Law is neither justice nor the will of the people. Take the provisional specs written by power down from the altar, and return them to modifiable tools."
  },
  {
    slug: "state-as-interoperability-layer",
    displayTitle: "国家を「支配者」から「互換性レイヤー」へ縮小せよ――市民が主導する統治機能のAPI化とオープン規格",
    displayTitleEn: "The State as an Interoperability Layer",
    source: "site/content/state-as-interoperability-layer.md",
    sourceEn: "site/content/en/state-as-interoperability-layer.md",
    label: "新着論考",
    labelEn: "New",
    date: "2026-07-15",
    read: "約6分",
    readEn: "6 min read",
    accent: "cyan",
    featured: true,
    summary: "国家の武力的な打倒を目指すのではなく、独占的な統治者から制度間の単なる互換性（相互運用）レイヤーへと縮小させる道筋。身元確認、契約、決済の規格をオープン化し、国家の抱き合わせ独占を解体する。",
    summaryEn: "Not predicting the end of the state, but charting its reduction from a monopolistic ruler to a compatibility layer between systems."
  },
  {
    slug: "address-is-not-allegiance",
    displayTitle: "「日本が嫌なら出て行け」を論破する――住所（居住地）と国家への忠誠を切り分ける「所属の自由」",
    displayTitleEn: "Address is Not Allegiance",
    source: "site/content/address-is-not-allegiance.md",
    sourceEn: "site/content/en/address-is-not-allegiance.md",
    label: "新着論考",
    labelEn: "New",
    date: "2026-07-15",
    read: "約5分",
    readEn: "5 min read",
    accent: "violet",
    featured: true,
    summary: "住んでいる土地への愛着と、そこに居座る国家権力への忠誠は別物である。なぜ国境を越えて引っ越さなければ統治ルールを選べないのか？居住地はそのままで、法・通貨・コミュニティを個別に選択・契約可能にするモジュール統治の論理。",
    summaryEn: "What becomes selectable when we separate attachment to land, legal jurisdiction, public services, and spiritual allegiance?"
  },
  {
    slug: "hundred-year-thesis",
    displayTitle: "百年仮説――日本が沈没しても個人が生き残るための「国家代替OS」4段階移行シナリオ",
    displayTitleEn: "The Hundred-Year Thesis",
    source: "drafts/2026-07-15_hundred_year_thesis.md",
    sourceEn: "drafts/en/2026-07-15_hundred_year_thesis.md",
    label: "百年仮説",
    labelEn: "Thesis",
    date: "2026-07-15",
    read: "約10分",
    readEn: "10 min read",
    accent: "orange",
    featured: true,
    summary: "日本国家を倒すのではなく、日本でなくても機能する社会を市民の手で実装する。人口減少と財政破綻に直面する既存国家の枠組みに縛られず、四段階で自律移行するための100年ロードマップと失敗条件。",
    summaryEn: "We don't want to topple Japan; we want to build a society that works outside of it. A four-stage transition plan and its failure conditions."
  },
  {
    slug: "doctrine-v2",
    displayTitle: "宇宙政府 ドクトリン v2――国家を選べる部品に変える7つの基本規範と市民OS設計図",
    displayTitleEn: "Univgov v2: The Selectable State Protocol",
    source: "univgov_doctrine_v2.md",
    sourceEn: "univgov_doctrine_v2.en.md",
    label: "基本綱領",
    labelEn: "Doctrine",
    date: "2026-07-14",
    read: "約12分",
    readEn: "12 min read",
    accent: "cyan",
    summary: "帰属選択の自由、非領土性、最小強制、機能分離、検証可能性、退出可能性（EXIT）、可逆性。国家の専横を未然に防ぎ、市民一人ひとりの主権を回復するためのUNIVGOV基本設計仕様書。",
    summaryEn: "Selectable allegiance, non-territoriality, minimal coercion, functional unbundling, verifiability, exitability, and reversibility."
  },
  {
    slug: "space-law-v1",
    displayTitle: "宇宙法典 v1.0（基本十条）――強制を最小化し個人の不可侵権を守るための初期基本条文",
    displayTitleEn: "Space Law v1.0: The First Ten Articles",
    source: "drafts/2026-07-14_space_law_v1.md",
    sourceEn: "drafts/en/2026-07-14_space_law_v1.md",
    label: "宇宙法",
    labelEn: "Law",
    date: "2026-07-14",
    read: "約9分",
    readEn: "9 min read",
    accent: "violet",
    summary: "命令や禁止の押しつけではなく、国家や集団による強制暴力を最小化するために策定された宇宙法典の原点・基本10条。反証可能性と合法的フォーク権を備えたオープンソース法規の草案。",
    summaryEn: "Not a list of commands, but a revisable norm to reduce coercion. The first ten articles and revision rules."
  },
  {
    slug: "cosmic-citizen-declaration",
    displayTitle: "宇宙国民宣言――出生地による忠誠の強制を拒絶し、自由な所属を選択する市民の誓い",
    displayTitleEn: "Cosmic Citizen Declaration",
    source: "drafts/2026-07-14_cosmic_citizen_declaration_v1.md",
    sourceEn: "drafts/en/2026-07-14_cosmic_citizen_declaration_v1.md",
    label: "宣言",
    labelEn: "Declaration",
    date: "2026-07-14",
    read: "約3分",
    readEn: "3 min read",
    accent: "orange",
    summary: "出生地と心の帰属を同一視しない。国家への盲従を脱し、検証と退出の権利を持った自律的個人として生きるための、任意・非独占・いつでも撤回可能な市民宣言。",
    summaryEn: "Do not equate birthplace with your heart's allegiance. An optional, non-exclusive, and revocable declaration of cosmic citizenship."
  },
];

export const spaceLawChapters = [
  {
    num: "00",
    title: "第0編：根本規範と基本的人権",
    titleEn: "Part 0: Charter & Inviolable Rights",
    desc: "出生地による忠誠強制の否定、非領土性、危害原則、生命不可侵、無条件EXIT権。",
    descEn: "Non-territoriality, harm principle, inviolability of life, and unconditional exit.",
    articles: [
      {
        num: "第1条",
        numEn: "Art. 1",
        title: "帰属選択の自由と多重所属",
        titleEn: "Freedom of Allegiance & Plural Affiliation",
        path: "00_fundamental/01_freedom_of_allegiance.md",
        summary: "出生地や国籍による忠誠強制を拒絶。心の国籍の自己決定と複数所属の保障。",
        summaryEn: "Rejecting forced allegiance by birthplace. Guaranteeing self-chosen plural affiliations.",
        roots: "ノージック / カント",
        rootsEn: "Nozick / Kant",
        sunset: "永続基本原則（5年見直し）",
        sunsetEn: "Perpetual core principle (5-yr review)"
      },
      {
        num: "第2条",
        numEn: "Art. 2",
        title: "非領土性と管轄の非独占",
        titleEn: "Non-Territoriality & Non-Monopoly Jurisdiction",
        path: "00_fundamental/02_non_territoriality.md",
        summary: "土地の軍事囲い込みを否定。合意に基づくプロトコル管轄。",
        summaryEn: "Rejecting military land enclosure. Consensual protocol jurisdiction.",
        roots: "J.C.スコット / ティーブー",
        rootsEn: "J.C. Scott / Tiebout",
        sunset: "永続基本原則",
        sunsetEn: "Perpetual core principle"
      },
      {
        num: "第3条",
        numEn: "Art. 3",
        title: "危害原則と最小強制",
        titleEn: "Harm Principle & Minimal Coercion",
        path: "00_fundamental/03_harm_principle.md",
        summary: "他者への具体的危害防止以外の強制を禁止。パターナリズムの排除。",
        summaryEn: "Prohibiting coercion except to prevent concrete harm. Anti-paternalism.",
        roots: "J.S.ミル / ノージック",
        rootsEn: "J.S. Mill / Nozick",
        sunset: "3年ごと",
        sunsetEn: "Every 3 years"
      },
      {
        num: "第4条",
        numEn: "Art. 4",
        title: "生命・意識・身体の不可侵権",
        titleEn: "Inviolability of Life, Mind & Body",
        path: "00_fundamental/04_inviolability_of_life.md",
        summary: "死刑・拷問・洗脳の絶対禁止。生命維持インフラの不可侵。",
        summaryEn: "Absolute ban on death penalty, torture, and brainwashing. Inviolable life support.",
        roots: "ベッカリーア / ニュルンベルク綱領",
        rootsEn: "Beccaria / Nuremberg Code",
        sunset: "永続基本原則",
        sunsetEn: "Perpetual core principle"
      },
      {
        num: "第5条",
        numEn: "Art. 5",
        title: "無条件退出権とデータ可搬性",
        titleEn: "Right of Exit & Data Portability",
        path: "00_fundamental/05_right_of_exit.md",
        summary: "ワンクリック完全EXITと全データ消去・持ち出し権利。個人データはオフチェーン管理。",
        summaryEn: "1-click complete EXIT, total data erasure/portability. Off-chain personal data.",
        roots: "ハーシュマン / GDPR",
        rootsEn: "Hirschman / GDPR",
        sunset: "永続基本原則",
        sunsetEn: "Perpetual core principle"
      }
    ]
  },
  {
    num: "01",
    title: "第1編：宇宙コモンズとインフラ開放",
    titleEn: "Part 1: Space Commons & Open Infrastructure",
    desc: "天体・軌道・通信の非領有、オストロム型資源採取、基盤独占の禁止と相互運用性。",
    descEn: "Non-appropriation of celestial bodies, Ostrom commons, anti-monopoly and interoperability.",
    articles: [
      {
        num: "第6条",
        numEn: "Art. 6",
        title: "天体・軌道・通信の非領有と共同利用",
        titleEn: "Non-Appropriation of Celestial Commons",
        path: "01_commons_environment/06_celestial_commons.md",
        summary: "月・火星・軌道・電波帯域の非領有と共有財保護。",
        summaryEn: "Non-appropriation of Moon, Mars, LEO, and spectrum. Global commons.",
        roots: "宇宙条約第2条 / ロック的但し書き",
        rootsEn: "Outer Space Treaty Art. II / Lockean Proviso",
        sunset: "5年ごと",
        sunsetEn: "Every 5 years"
      },
      {
        num: "第7条",
        numEn: "Art. 7",
        title: "資源採取の用益権と多中心管理",
        titleEn: "Resource Usufruct & Polycentric Commons",
        path: "01_commons_environment/07_resource_usufruct.md",
        summary: "労働用益権（Usufruct）の承認と当事者自治（コモンズ原則）。",
        summaryEn: "Labor usufruct and polycentric self-governance (Commons Principles).",
        roots: "エリノア・オストロム",
        rootsEn: "Elinor Ostrom",
        sunset: "3年ごと",
        sunsetEn: "Every 3 years"
      },
      {
        num: "第8条",
        numEn: "Art. 8",
        title: "基盤独占の禁止と相互運用性の義務",
        titleEn: "Anti-Monopoly & Interoperability Mandate",
        path: "01_commons_environment/08_anti_monopoly.md",
        summary: "生命維持・通信・ハッチ結合規格のオープン化と囲い込み禁止。",
        summaryEn: "Open standards for life support, comms, and docking; anti-lock-in.",
        roots: "オープン標準 / 反トラスト法理",
        rootsEn: "Open Standards / Antitrust Jurisprudence",
        sunset: "3年ごと",
        sunsetEn: "Every 3 years"
      }
    ]
  },
  {
    num: "02",
    title: "第2編：経済自律・通貨・契約",
    titleEn: "Part 2: Economic Autonomy & Currency Freedom",
    desc: "通貨発行の自由、初期分配金（UNI）、スマート仲裁、非搾取的公共財調達。",
    descEn: "Monetary freedom, initial endowment (UNI), smart arbitration, voluntary public goods.",
    articles: [
      {
        num: "第9条",
        numEn: "Art. 9",
        title: "通貨競合と初期分配金（UNI Protocol）",
        titleEn: "Monetary Freedom & Native Initial Endowment",
        path: "02_economy_currency/09_monetary_freedom.md",
        summary: "法定通貨強制の拒絶。全市民へ10⁶ UNI初期原資交付。初期段階はGoogle連動等を活用。",
        summaryEn: "Rejection of legal tender laws. 10⁶ UNI initial endowment with pragmatic bootstrap.",
        roots: "F.A.ハイエク（貨幣発行自由化）",
        rootsEn: "F.A. Hayek (Denationalisation of Money)",
        sunset: "3年ごと",
        sunsetEn: "Every 3 years"
      },
      {
        num: "第10条",
        numEn: "Art. 10",
        title: "契約自由とスマート仲裁",
        titleEn: "Contractual Autonomy & Smart Arbitration",
        path: "02_economy_currency/10_contractual_autonomy.md",
        summary: "スマートコントラクト（Lex Contractus）と分散仲裁の承認。",
        summaryEn: "Smart contracts as lex contractus and decentralized arbitration.",
        roots: "私的自治 / Lex Cryptographia",
        rootsEn: "Private Autonomy / Lex Cryptographia",
        sunset: "2年ごと",
        sunsetEn: "Every 2 years"
      },
      {
        num: "第11条",
        numEn: "Art. 11",
        title: "非搾取的公共財調達",
        titleEn: "Voluntary & Pigovian Public Goods",
        path: "02_economy_currency/11_pigovian_public_goods.md",
        summary: "強制徴税を廃止。ピグー利用料と自発的寄付（クアドラティック・ファンディング等）。",
        summaryEn: "Abolishing punitive taxation. Pigovian fees and Quadratic Funding (QF).",
        roots: "ピグー / ヴィタリック・ブテリン",
        rootsEn: "A.C. Pigou / Vitalik Buterin",
        sunset: "2年ごと",
        sunsetEn: "Every 2 years"
      }
    ]
  },
  {
    num: "03",
    title: "第3編：紛争解決と互換レイヤー",
    titleEn: "Part 3: Dispute Resolution & Interoperability",
    desc: "民事の合意仲裁、物理的暴力防止における既存国家互換レイヤーとの協調、宇宙救難義務。",
    descEn: "Consensual civil arbitration, state interoperability for physical violence, universal rescue.",
    articles: [
      {
        num: "第12条",
        numEn: "Art. 12",
        title: "合意管轄と分散型仲裁",
        titleEn: "Consensual Arbitration & State Interoperability",
        path: "03_dispute_justice/12_consensual_arbitration.md",
        summary: "裁判権独占の解体。民事は合意仲裁。物理的暴力・重大犯罪は既存国家互換レイヤーに委ねる。",
        summaryEn: "Consensual civil arbitration. Physical violence handled by existing state legal infrastructure.",
        roots: "中世商事法（Lex Mercatoria）",
        rootsEn: "Medieval Lex Mercatoria",
        sunset: "3年ごと",
        sunsetEn: "Every 3 years"
      },
      {
        num: "第13条",
        numEn: "Art. 13",
        title: "普遍的相互救難義務",
        titleEn: "Universal Search & Rescue Duty",
        path: "03_dispute_justice/13_universal_rescue.md",
        summary: "極限環境での遭難救助義務と救難費用の最優先補償。",
        summaryEn: "Mandatory distress rescue in extreme environments; priority compensation.",
        roots: "国際海商法 / 普遍的共助",
        rootsEn: "Maritime Law / Universal Mutual Aid",
        sunset: "2年ごと",
        sunsetEn: "Every 2 years"
      }
    ]
  },
  {
    num: "04",
    title: "第4編：Gitネイティブ立法・検証・フォーク",
    titleEn: "Part 4: Legislative Lifecycle & Forking",
    desc: "全法規の義務的サンセット、実利的な合意形成、合法的フォーク権。",
    descEn: "Mandatory sunsets, practical consensus tools, and inherent right to fork.",
    articles: [
      {
        num: "第14条",
        numEn: "Art. 14",
        title: "義務的サンセット条項と実証的検証",
        titleEn: "Mandatory Sunset Commits & Empirical Audit",
        path: "04_legislative_lifecycle/14_mandatory_sunset.md",
        summary: "全法規の自動失効とEBPMデータに基づく再承認義務。",
        summaryEn: "Automatic self-expiration without empirical proof of efficacy.",
        roots: "トーマス・ジェファーソン / EBPM",
        rootsEn: "Thomas Jefferson / EBPM",
        sunset: "3年ごと",
        sunsetEn: "Every 3 years"
      },
      {
        num: "第15条",
        numEn: "Art. 15",
        title: "Git改訂手続と合法的フォーク権",
        titleEn: "Git-Native Protocol & Inherent Right to Fork",
        path: "04_legislative_lifecycle/15_merge_protocol_and_fork.md",
        summary: "投票の道具的活用。多数決専制を排し、不一致時は平和的フォーク。",
        summaryEn: "Voting as a tool; avoiding tyranny of majority. Peaceful forking upon disagreement.",
        roots: "OSS哲学 / アローの不可能性定理",
        rootsEn: "OSS Philosophy / Arrow's Theorem",
        sunset: "永続基本原則",
        sunsetEn: "Perpetual core principle"
      }
    ]
  }
];

export const aiGovernancePrompts = [
  {
    id: "ebpm-audit",
    badge: "POLICY EVALUATION",
    badgeEn: "POLICY EVALUATION",
    title: "政策評価カード自動生成（自治体・国の予算/補助金監査）",
    titleEn: "Policy Evaluation Card Generator (Budget & Subsidy Audit)",
    desc: "国や自治体の事業（IT調達、補助金、公共事業等）を、UNIVGOVの政策評価カード標準フォーマット（目的・コスト・KPI・代替案・リスク・廃止条件）で批判的に監査・出力させるプロンプト。",
    descEn: "Audits municipal and national spending (IT procurement, subsidies, public projects) into the standardized UNIVGOV Policy Evaluation Card.",
    prompt: `あなたは「宇宙政府（UNIVGOV）」の政策評価監査官（パーソナルAI官僚）です。
以下の政策・事業について、行政事業レビューシートや公開調達実績の観点から厳格に分析し、UNIVGOV標準の「政策評価カード」形式（Markdown表）で出力してください。

【監査対象】
（ここに事業名やURL、予算規模、概要を入力。例：自治体情報システムの標準化移行、特定の補助金事業、マイナンバー関連調達）

【出力フォーマット】
### 政策評価カード：[事業名]
| 評価項目 | 内容・定量的データ |
|---|---|
| **目的** | 制度が公称する本来の目的 |
| **コスト** | 国費・自治体・国民負担の総額（推計含む） |
| **効果指標** | 検証可能な具体的KPIと客観的達成度 |
| **代替案** | (a) 市場・民間競争による解決 (b) オープンプロトコル/OSSによる解決 (c) 直接給付/バウチャー |
| **既知のリスク** | ベンダーロックイン、利権化、クリームスキミング等の副作用 |
| **廃止条件** | 何年以内にどの指標が未達なら即時廃止・返金すべきかの客観的トリガー |

最後に、本事業が「国家の独占的抱き合わせ」に該当するか否かの判定と、市民が今すぐ取れる防衛策（部分EXIT）を200文字以内で述べてください。`
  },
  {
    id: "harm-linter",
    badge: "SPACE LAW LINTER",
    badgeEn: "SPACE LAW LINTER",
    title: "法案・規制の危害原則リンター（SLMP-1準拠CI判定）",
    titleEn: "Harm Falsification & Anti-Paternalism Linter (SLMP-1)",
    desc: "提出された法案やルールを、宇宙法マージプロトコル（SLMP-1）の基準で自動判定。主観的道徳やパターナリズム（余計なお世話）による規制を検出し、CI合格/不合格を判定するプロンプト。",
    descEn: "Automatically audits bills against SLMP-1 standards, detecting subjective morality, paternalism, and lack of harm data.",
    prompt: `あなたは「宇宙法マージプロトコル（SLMP-1）」の自動審査リンター（AI CI/CD Engine）です。
以下の法案・規則案について、SLMP-1の基本原則に基づき厳格に構文および論理審査を行い、マージ判定を下してください。

【審査対象の法案・規制】
（ここに規制案・ルール・法律の条文を入力）

【審査基準】
1. 非強制・個別化テスト: なぜ個別オプトイン・プラグインではなく全体強制（Core）である必要があるか？
2. 危害の反証可能性テスト: 第三者への具体的・直接的・回復不能な物理的/経済的危害の定量的データがあるか？「道徳・感情・秩序・お節介（パターナリズム）」を理由とする規制は即時REJECT。
3. 義務的サンセット: 1〜3年の失効期日（TTL）と再評価KPIが明記されているか？

【判定出力】
- 判定結果: [CI PASSED / AUTO-REJECT / FORK RECOMMENDED]
- 検出されたパターナリズム・道徳規制の箇所:
- 危害データの定量的検証:
- 修正提案またはオプトインプラグイン化のアドバイス:`
  },
  {
    id: "personal-exit",
    badge: "EXIT COPILOT",
    badgeEn: "EXIT COPILOT",
    title: "UNIVGOV思想との対話・生活防衛壁打ち（Personal Exit Copilot）",
    titleEn: "UNIVGOV Deliberation & Personal Exit Copilot",
    desc: "UNIVGOVの全思想集成（univgov_all.md）を前提として、税金・通貨・社会保険・資格・住所の抱き合わせから、個人として今すぐできる生活防衛と合法的EXITをAIと壁打ちするプロンプト。",
    descEn: "Deliberate directly with AI based on the full UNIVGOV doctrine to explore practical, legal partial-exit steps.",
    prompt: `あなたは「宇宙政府（UNIVGOV）」の思想と全20条の宇宙法典を完全に理解した知性派アドバイザーです。
前提として、https://univgov.pages.dev/univgov_all.md にあるUNIVGOVの基本綱領（国家を運命から選べる部品へ、七原則、非領土性、Bitcoin/Lightningによる生活防衛、合法的EXIT）に基づき回答してください。

私の現在の状況と悩みは以下のとおりです：
【相談内容】
（例：会社員としての給与手取り減少、インフレ増税への対策、公金補助金カルテルへの違和感、自分のスキルを国家資格以外で証明したい等）

国家と無益に戦うのではなく、「より使える代替システムを自分の生活に実装する」という観点から、今すぐ実践できる具体的なアクション（部分退出ステップ）を3段階で提示してください。`
  }
];
