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

## Cloudflare Workersの設定


キューのコンシューマーバインディングを削除
`wrangler queues consumer remove scheduled-notifications-dev fcm-web-push-worker-dev`

Workerの削除
`wrangler delete --name fcm-web-push-worker-dev`



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