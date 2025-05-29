# FCM Web Push Service (Cloudflare Workers + Hono)

Firebase Cloud Messaging (FCM) を使用してWebプッシュ通知を送信するCloudflare Workers サービスです。Honoフレームワークを使用して構築されています。

## 技術スタック

- **Framework**: Hono
- **Runtime**: Cloudflare Workers
- **Push Service**: Firebase Cloud Messaging (FCM)
- **Authentication**: Google Auth Library

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase設定

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. プロジェクト設定 > サービスアカウント > 新しい秘密鍵の生成
3. JSONファイルをダウンロードして、以下の値を取得:
   - `project_id`
   - `private_key`
   - `client_email`

### 3. 環境変数の設定

`.dev.vars.example`をコピーして`.dev.vars`を作成し、Firebase設定を入力:

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars`ファイルを編集:

```
FCM_PROJECT_ID="your-firebase-project-id"
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
FCM_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

サーバーは `http://localhost:8787` で起動します。

### 5. デプロイ

```bash
npm run deploy
```

**注意**: デプロイ前にCloudflare Workers ダッシュボードで環境変数を設定してください。

## API エンドポイント

### ヘルスチェック

```
GET /
```

サービスの稼働状況を確認します。

### 単一通知送信

```
POST /send-notification
```

単一のプッシュ通知を送信します。

**リクエストボディ:**

```json
{
  "token": "FCM_DEVICE_TOKEN",
  "title": "通知タイトル",
  "body": "通知本文",
  "icon": "/icon.png",
  "badge": "/badge.png",
  "data": {
    "key1": "value1",
    "key2": "value2"
  },
  "actions": [
    {
      "action": "action1",
      "title": "アクション1",
      "icon": "/action1.png"
    }
  ]
}
```

### 一括通知送信

```
POST /send-notification-batch
```

複数のデバイストークンに一括でプッシュ通知を送信します。

**リクエストボディ:**

```json
{
  "tokens": ["token1", "token2", "token3"],
  "title": "通知タイトル",
  "body": "通知本文",
  "icon": "/icon.png",
  "badge": "/badge.png",
  "data": {
    "key1": "value1"
  }
}
```

### 帰宅時間通知

```
POST /send-go-home-notification
```

帰宅時間専用の通知を送信します。

**リクエストボディ:**

```json
{
  "token": "FCM_DEVICE_TOKEN",
  "userName": "田中太郎",
  "customMessage": "今日もお疲れ様でした！"
}
```

## 使用例

### cURL

```bash
# 単一通知
curl -X POST http://localhost:8787/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_FCM_TOKEN",
    "title": "テスト通知",
    "body": "これはテスト通知です"
  }'

# 帰宅時間通知
curl -X POST http://localhost:8787/send-go-home-notification \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_FCM_TOKEN",
    "userName": "田中太郎"
  }'
```

### JavaScript (fetch)

```javascript
// 帰宅時間通知の送信
const response = await fetch('https://your-worker.your-subdomain.workers.dev/send-go-home-notification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: userFcmToken,
    userName: '田中太郎',
    customMessage: '今日もお疲れ様でした！ゆっくり休んでください。'
  })
});

const result = await response.json();
console.log(result);
```

## CORS設定

デフォルトでは以下のオリジンからのリクエストを許可しています:

- `http://localhost:3000` (開発環境)
- `https://your-frontend-domain.vercel.app` (本番環境)

必要に応じて `src/index.ts` の CORS設定を変更してください。

## トラブルシューティング

### FCM認証エラー

- Firebase プロジェクトの設定を確認
- サービスアカウントキーが正しく設定されているか確認
- FCM APIが有効になっているか確認

### CORS エラー

- `src/index.ts` のCORS設定でフロントエンドのドメインが許可されているか確認

### デプロイエラー

- Cloudflare Workers ダッシュボードで環境変数が設定されているか確認
- `wrangler.toml` の設定が正しいか確認

## License

MIT 