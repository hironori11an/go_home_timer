# 実装計画書

## 1. 概要
本プロジェクトでは、指定された時間帯にプッシュ通知を送信する機能を実装します。プッシュ通知の送信にはFirebase Cloud Messaging (FCM)を使用し、通知のスケジューリングにはCloudflare Queueを利用します。バックエンドはCloudflare Workersで実装します。

## 2. システム構成

### 2.1 コンポーネント
- フロントエンド（Next.js）
- バックエンド（Cloudflare Workers + TypeScript）
- Firebase Cloud Messaging (FCM)
- Cloudflare Queue

### 2.2 アーキテクチャ図
```
[フロントエンド] → [Cloudflare Workers] → [Cloudflare Queue] → [FCM] → [ユーザーデバイス]
```

## 3. 実装詳細

### 3.1 フロントエンド実装
1. FCMの初期化と設定
   - Firebase SDKの導入
   - サービスワーカーの設定
   - FCMトークンの取得と管理

2. 通知設定UI
   - 通知時間帯の設定フォーム
   - 通知設定の送信機能
   - 現在の設定表示

### 3.2 バックエンド実装（Cloudflare Workers）
1. プロジェクト構成
   - TypeScript設定
   - Wrangler設定
   - 環境変数の設定

2. FCM関連
   - プッシュ通知送信API
   - 通知テンプレート管理

3. Cloudflare Queue連携
   - キューへのジョブ追加API
   - ワーカー実装
   - エラーハンドリング

4. データ構造
```typescript
// 通知設定の型定義
interface NotificationSettings {
  startTime: string;  // HH:mm形式
  endTime: string;    // HH:mm形式
  isActive: boolean;
}

// キューに送信するジョブの型定義
interface NotificationJob {
  fcmToken: string;
  notificationSettings: NotificationSettings;
  timestamp: string;
}
```

## 4. 実装手順

### 4.1 フェーズ1: 基本設定
1. Firebaseプロジェクトのセットアップ
2. Cloudflare Workersプロジェクトの初期化
3. 必要なパッケージのインストール

### 4.2 フェーズ2: バックエンド実装
1. FCM関連APIの実装
2. Cloudflare Queueワーカーの実装
3. エラーハンドリングとログ実装

### 4.3 フェーズ3: フロントエンド実装
1. FCM初期化
2. 通知設定UIの実装
3. APIとの連携

### 4.4 フェーズ4: テストとデプロイ
1. 単体テスト
2. 統合テスト
3. Cloudflare Workersへのデプロイ

## 5. セキュリティ考慮事項
- FCMトークンの安全な取り扱い
- APIエンドポイントの認証（Cloudflare Access）
- レート制限の実装（Cloudflare Rate Limiting）

## 6. 監視とログ
- Cloudflare Workersのログ収集
- 通知送信状況の監視
- パフォーマンスメトリクスの収集
- Cloudflare Analyticsの活用

## 7. 今後の拡張性
- 複数の通知タイプのサポート
- 通知テンプレートのカスタマイズ
- 通知履歴の管理
- バッチ処理の最適化
- Cloudflare Workersのグローバル展開 