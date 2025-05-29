# Go Home Timer

帰宅時間通知システム - 指定した時間にプッシュ通知を送信するWebアプリケーション

## 📋 概要

Go Home Timerは、設定した時間帯にプッシュ通知を送信することで、帰宅時間のリマインダーを提供するWebアプリケーションです。Firebase Cloud Messaging (FCM)とCloudflare Workersを活用したモダンなアーキテクチャで構築されています。

## 🏗️ アーキテクチャ

```
[フロントエンド] → [Cloudflare Workers] → [Cloudflare Queue] → [FCM] → [ユーザーデバイス]
     ↓                     ↓                    ↓
[Next.js on Vercel]  [Service Worker]    [Notification Job]
```

## 🛠️ 技術スタック

### フロントエンド
- **Next.js** 15.3.2
- **React** 19.0.0
- **TypeScript** 5.x
- **Tailwind CSS** 4.x
- **Firebase SDK** 11.8.1
- **ホスティング**: Vercel

### バックエンド
- **Cloudflare Workers**
- **Cloudflare Queue**（通知スケジューリング用）
- **TypeScript**

### プッシュ通知
- **Firebase Cloud Messaging (FCM)**
- **Web Push**

## 📁 プロジェクト構造

```
go_home_timer/
├── src/                    # Next.jsフロントエンド
│   ├── app/               # App Router
│   │   ├── page.tsx       # メインページ
│   │   ├── layout.tsx     # レイアウト
│   │   └── api/           # API Routes
│   └── lib/               # ユーティリティライブラリ
├── cloudflare-workers/    # Cloudflare Workers
│   ├── src/               # ワーカーソースコード
│   ├── wrangler.toml      # Wrangler設定
│   └── package.json       # ワーカー用依存関係
├── docs/                  # 実装計画書
├── public/                # 静的ファイル
└── package.json           # メイン依存関係
```

## 🚀 セットアップ

### 前提条件

- Node.js 20.x 以上
- npm または yarn
- Cloudflareアカウント
- Firebaseプロジェクト

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd go_home_timer
```

### 2. 依存関係のインストール

```bash
# フロントエンド
npm install

# Cloudflare Workers
cd cloudflare-workers
npm install
cd ..
```

### 3. 環境変数の設定

#### フロントエンド用
`.env.local`ファイルを作成し、Firebase設定を追加：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
```

#### Cloudflare Workers用
`cloudflare-workers/.dev.vars`ファイルを作成：

```env
FCM_SERVER_KEY=your_fcm_server_key
FIREBASE_PROJECT_ID=your_project_id
```

### 4. Firebase設定

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. Cloud Messagingを有効化
3. Web Push証明書（VAPID キー）を生成
4. サービスアカウントキーを取得

## 🖥️ 開発

### フロントエンドの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス

### Cloudflare Workersの開発

```bash
cd cloudflare-workers
npm run dev
```

## 📦 デプロイ

### フロントエンド（Vercel）

```bash
npm run build
# Vercelにデプロイ
```

### Cloudflare Workers

```bash
cd cloudflare-workers
npm run deploy
```

## 🎯 機能

### 現在実装済み
- ✅ FCMトークンの取得
- ✅ プッシュ通知の送信テスト
- ✅ Cloudflare Workersとの連携

### 実装予定
- ⏳ 通知時間の設定UI
- ⏳ スケジュール通知（Cloudflare Queue使用）
- ⏳ 通知履歴の管理
- ⏳ カスタム通知メッセージ

