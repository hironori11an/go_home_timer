# 🏠 おうちタイマー

長い針がここまで来たらおうちに帰ろうね！子ども向けの可愛いタイマーアプリです。

## ✨ 機能

- 📱 **モバイルファースト**: スマートフォンで使いやすいレスポンシブデザイン
- 🕐 **アナログ時計**: 子どもにもわかりやすいアナログ時計表示
- 🔔 **プッシュ通知**: 指定時刻にWebプッシュ通知でお知らせ
- 🎯 **簡単操作**: 長針の数値（1-12）を選択するだけ
- 🎨 **子ども向けUI**: 楽しくて分かりやすいインターフェース

## 🛠️ 技術仕様

- **フロントエンド**: Next.js 15.3.2
- **ホスティング**: Vercel
- **通知サービス**: Firebase Cloud Messaging (FCM)
- **スケジューリング**: Cloudflare Workers + Cloudflare Queue
- **PWA対応**: Progressive Web App

## 🚀 セットアップ

### 前提条件

- Node.js 20以上
- Firebase プロジェクト
- Cloudflare アカウント

### 1. Firebase の設定

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. Cloud Messagingを有効化
3. Web アプリを追加してconfig情報を取得
4. VAPID キーを生成

### 2. 環境変数の設定

`.env.local` ファイルを作成：

```bash
# Firebase Configuration (Frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Cloudflare Workers Configuration
CLOUDFLARE_WORKER_URL=https://your-worker.your-subdomain.workers.dev
CLOUDFLARE_WORKER_TOKEN=your_worker_auth_token
```

### 3. フロントエンドの起動

```bash
npm install
npm run dev
```

### 4. Cloudflare Workers のデプロイ

```bash
cd cloudflare-workers
npm install
wrangler deploy
```

## 📱 使い方

1. アプリを開くとアナログ時計が表示されます
2. 長い針がどの数値（1-12）まで来たら帰るかを選択
3. 「タイマーをセット！」ボタンを押す
4. 指定時刻になるとプッシュ通知でお知らせ

## 🔧 開発

### ローカル開発環境

```bash
# フロントエンド
npm run dev

# Cloudflare Workers (別ターミナル)
cd cloudflare-workers
wrangler dev
```

### ビルドとデプロイ

```bash
# フロントエンド（Vercel）
npm run build

# Cloudflare Workers
cd cloudflare-workers
wrangler deploy --env production
```

## 📂 プロジェクト構成

```
go_home_timer/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── schedule-notification/
│   │   ├── page.tsx              # メインページ
│   │   └── layout.tsx            # レイアウト
│   └── lib/
│       └── firebase.ts           # Firebase設定
├── cloudflare-workers/
│   ├── src/
│   │   ├── index.ts              # メインWorker
│   │   └── fcm.ts                # FCMサービス
│   └── wrangler.toml             # Worker設定
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── icon.png                  # アプリアイコン
│   └── firebase-messaging-sw.js  # Service Worker
└── docs/
    └── implementation_plan_front.md # 実装計画書
```

## 🎯 実装のポイント

### 時間計算ロジック

長針の位置を分単位に変換：
- 1 → 5分
- 2 → 10分
- 3 → 15分
- ...
- 12 → 60分（0分）

### スケジューリング

1. フロントエンドで選択された時間を計算
2. Next.js APIでCloudflare Workersに送信
3. Cloudflare Queueでスケジューリング
4. 指定時刻にFCMでプッシュ通知送信

## 🔔 通知について

- ブラウザの通知許可が必要
- PWA対応によりホーム画面に追加可能
- バックグラウンドでもプッシュ通知を受信

## 🎨 デザインコンセプト

- 子どもが直感的に理解できるUI
- 明るく親しみやすい色使い
- タッチしやすいボタンサイズ
- アナログ時計による視覚的な時間理解

## 📄 ライセンス

MIT License

