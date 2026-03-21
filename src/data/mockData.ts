export const STOCK_INPUT_CONTENT = {
  header: {
    title: "BUFFETT'S WISDOM",
    userProfileUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBUX-AGmul8oOOiy9MUYsA_YGTyrrW_NX721bhhrDWtAJXNo9ZAuNlabYjZXe_-cxAKWPKq7ZxlTdyryi9yJSfn5_7uY1Dj3_Wfz9VdEXtGCeRVFwT73xD3e6b0zn4HC0nLn7lJXRUxRI2C_K1QGK51_WX7Zlj6sLB735OMM-5UeLBC1bVWujrpFfCZSqj_wfmBFYWdEf9CdkmN2tJsf4TMxxin77Y7N_H-4-qwedbS5N9rVt7fd0rGy9Ihi0wte2STz4R-Lhgb030",
  },
  hero: {
    title: "本質的価値の発見",
    description: "定量的な数値と定性的な評価を融合し、伝説の投資哲学で銘柄を分析します。",
  },
  cta: {
    tabs: ["日本株", "米国株"],
    placeholder: "ティッカーを入力",
    buttonText: "診断を開始する",
  },
  marketIntelligence: {
    label: "Market Overview",
    title: "バフェット・インデックス: 182%",
    description: "市場全体の過熱感を計測しています",
    status: "要警戒フェーズ",
  },
  features: [
    {
      icon: "account_balance",
      title: "資本配分",
      description: "経営陣が効率よく利益を再投資しているかを、ROEと配当性向から詳細に分析します。",
    },
    {
      icon: "fort",
      title: "経済的堀",
      description: "ブランド力やネットワーク効果など、長期的な競争優位性を独自指標で評価します。",
    },
    {
      icon: "shield",
      title: "安全域",
      description: "本質的価値と市場価格の乖離を算出し、投資に伴うリスクを可視化します。",
    },
  ],
  footer: {
    quote: "「価格とは支払うもの。価値とは受け取るもの。」",
    author: "ウォーレン・バフェット",
  },
};

export const SCORING_RESULTS_MOCK = {
  ticker: "AAPL:NASDAQ",
  name: "アップル (Apple Inc.)",
  score: 85,
  summary: "堀（Moat）の深さと収益性の持続可能性が極めて高く評価されています。",
  metrics: [
    { label: "ROE", value: "147.4%", grade: "S", status: "卓越した資本効率", description: "ROEは資本効率を示す指標です。..." },
    { label: "営業利益率", value: "25.3%", grade: "A+", status: "強力な価格決定力", description: "売上高に対する営業利益の割合です。..." },
    { label: "PER", value: "29.1x", grade: "B", status: "プレミアム評価圏", description: "利益に対する株価の倍率です。..." },
    { label: "PBR", value: "38.4x", grade: "C-", status: "高い期待値", description: "純資産に対する株価の倍率です。..." },
    { label: "自己資本比率", value: "14.1%", grade: "B-", status: "レバレッジ活用", description: "財務の健全性を示す指標です。..." },
    { label: "配当利回り", value: "0.57%", grade: "B", status: "継続的な還元姿勢", description: "株主への利益還元を示す指標です。..." },
  ],
  qualitative: [
    { label: "ブランド・モート", subLabel: "顧客のロイヤリティとエコシステム", status: "強力" },
    { label: "経営陣の質", subLabel: "資本配分と実行力", status: "卓越" },
  ],
  thesis: [
    {
      title: "持続可能な競争優位性",
      content: "iOSエコシステムによる高いスイッチングコストと、唯一無二のブランド価値が長期的なキャッシュフローを支えます。",
    },
    {
      title: "資本配分戦略",
      content: "潤沢なフリーキャッシュフローを背景とした継続的な自社株買いと配当増額は、株主価値の最大化に向けた明確な意思表示です。",
    },
  ],
};
