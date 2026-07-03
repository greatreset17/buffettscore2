# Buffett AI Screener - 機能概要と技術仕様

「Buffett AI Screener」は、ウォーレン・バフェットの投資哲学をデジタル時代に昇華させた、AI搭載型の次世代株式分析・検索プラットフォームです。Google Gemini 2.0 世代の最新AI技術と、高度なベクトル検索技術を組み合わせ、直感的な投資判断をサポートします。

---

## 🚀 主要機能

### 1. セマンティック（ベクトル）検索
単なるキーワード一致ではなく、企業の「事業内容の文脈」を理解した検索が可能です。
- **テーマ検索**: 「生成AIに関わる企業」「サブスクリプション型のソフトウェア」といった自然言語での検索に対応。
- **類似銘柄の発見**: 特定の企業とビジネスモデルが似ている競合他社をベクトル空間上の距離から瞬時に特定。
- **最新モデルの採用**: `gemini-embedding-2`（768次元）による高精度な意味理解を実現。

### 2. AI株式診断 (Analyze Tool)
バフェットの視点を取り入れた独自のスコアリング・エンジンを搭載しています。
- **定量的評価**: ROE、利益率、自己資本比率、PERなどの財務指標をYahoo Financeからリアルタイム取得。
- **定性的評価**: 「ワイド・モート（経済的溝）」「経営陣の質」「参入障壁」などの非財務情報をAIが深く分析。
- **バフェット・スコア**: 企業の魅力を0〜100点で算出し、バフェットらしい表現で投資価値を要約。

### 3. インテリジェント・AIチャット
対話形式で市場の探索や個別銘柄の深掘りが可能です。
- **AIツール連携**: チャットの中でAIが自律的に「銘柄分析ツール」を呼び出し、最新データを提示。
- **グラフィカルなUI**: 分析結果は視覚的な「Stock Card」として表示され、一目で要点が把握可能。

### 4. ハイブリッド検索エンジン
- **高速な絞り込み**: ティッカーシンボルや社名による従来型の高速検索と、AIによる意味検索を統合。
- **膨大なデータセット**: 日米の主要市場（東証、NYSE、NASDAQ等）を網羅した14,000件超の銘柄データベース。

---

## 🛠 技術スタック

### フロントエンド
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **Components**: Lucide React, Framer Motion (アニメーション)
- **State Management**: React Server Components & Hooks

### バックエンド / インフラ
- **Database**: Supabase (PostgreSQL)
- **Vector Engine**: pgvector (ベクトル類似度検索)
- **Data Source**: Yahoo Finance API (Yahoo Finance 2)

### AI / 機械学習
- **Model**: Google Gemini 1.5 Flash / Pro (分析・対話)
- **Embedding**: Gemini Embedding 2 (ベクトル化)
- **SDK**: Vercel AI SDK, @ai-sdk/google

---

## 📈 データベース構造
- **tickersテーブル**: 銘柄基本情報、事業概要、およびベクトル化された埋め込みデータ（embedding列）を保持。
- **RPC (Remote Procedure Calls)**: 高速な近傍探索（cosine similarity）を実現するためのカスタムSQL関数。

---

## 🌟 プロジェクトのこだわり
- **Premium Aesthetics**: ダークモードを基調とした、プロフェッショナルかつ美しいUIデザイン。
- **Performance**: 1万件を超える銘柄データを、Supabaseのインデックス最適化によりミリ秒単位で検索。
- **Scalability**: Stitchを活用したコンポーネント設計により、新機能の迅速な追加が可能。
