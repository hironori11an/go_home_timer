# 🏠 おうちタイマー

帰りたがらない子ども向けの、時計タイマーアプリ。
設定した時間になると、プッシュ通知が送信され、スーパーヒーローが帰宅する動画が流れる


## 🛠️ 技術仕様

- **フロントエンド**: Next.js 15.3.2
- **ホスティング**: Vercel
- **通知サービス**: Firebase Cloud Messaging (FCM)
- **スケジューリング**: Cloudflare Workers + Cloudflare Queue
- **PWA対応**: Progressive Web App
- [プッシュ通知のシステムフロー図](/push-notification-system-flow.md)

## 🚀 セットアップ

### 前提条件

- Node.js 20以上
- Vercel アカウント
- Firebase プロジェクト
- Cloudflare アカウント

### 1. Firebase の設定

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. Cloud Messagingを有効化
3. Web アプリを追加してconfig情報を取得
4. VAPID キーを生成

### 2. 環境変数の設定

`.env.local` ファイルを作成(`env.example`を参照)


### 3. フロントエンドの起動

```bash
npm install
npm run dev
```

### 4. Cloudflare Workers の起動

```bash
cd cloudflare-workers
npm install
wrangler dev
```

## 📱 使い方

1. アプリを開くとアナログ時計が表示されます
2. 長い針がどの数値（1-12）まで来たら帰るかを選択
3. 「タイマーをセット！」ボタンを押す
4. 指定時刻になるとプッシュ通知でお知らせ

## 🔧 開発

### ビルドとデプロイ

- フロントエンド（Vercel）
  - GitHubと連携。mainブランチにマージ、コミット時にデプロイ
- Cloudflare Workers

```bash
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

