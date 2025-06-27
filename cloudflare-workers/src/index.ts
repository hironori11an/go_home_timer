import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { FCMService, type Bindings, type FCMMessage } from './fcm';
import type { Context, Next } from 'hono';

// 拡張されたBindings型
interface ExtendedBindings extends Bindings {
  SCHEDULED_NOTIFICATIONS_QUEUE: Queue;
  API_KEY: string; // APIキー認証用
  APP_ENV?: string;
}

// スケジュールされた通知のデータ型
interface ScheduledNotification {
  fcmToken: string;
  scheduledTime: string;
  targetHour: number;
  message: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, string>;
  };
}

// 通知送信の共通処理関数
async function sendNotificationInternal(
  env: ExtendedBindings,
  params: {
    token: string;
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    data?: Record<string, string>;
    actions?: Array<{
      action: string;
      title: string;
      icon?: string;
    }>;
  }
) {
  if (!params.token) {
    throw new Error('tokenは必須です');
  }

  const fcmService = new FCMService(env);

  const message: FCMMessage = {
    token: params.token,
    notification: {
      title: params.title || '🏠 おうちに帰る時間だよ！',
      body: params.body || 'お疲れ様でした！今日も一日頑張りましたね。',
    },
    data: params.data,
    webpush: {
      notification: {
        icon: params.icon,
        badge: params.badge,
        actions: params.actions,
      },
    },
  };

  const response = await fcmService.sendMessage(message);
  const result = await response.json() as { name?: string; error?: { message: string } };

  if (response.ok) {
    return { 
      success: true, 
      messageId: result.name,
      message: 'プッシュ通知が正常に送信されました'
    };
  } else {
    console.error('FCM Error:', result);
    throw new Error(`プッシュ通知の送信に失敗しました: ${JSON.stringify(result)}`);
  }
}

const app = new Hono<{ Bindings: ExtendedBindings }>();

// APIキー認証ミドルウェア
const apiKeyAuth = async (c: Context<{ Bindings: ExtendedBindings }>, next: Next) => {
  // POSTリクエストのみ認証を要求
  if (c.req.method === 'POST') {
    const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return c.json({ error: 'APIキーが必要です' }, 401);
    }
    
    if (apiKey !== c.env.API_KEY) {
      return c.json({ error: '無効なAPIキーです' }, 401);
    }
  }
  
  await next();
};

// CORS設定
app.use('*', (c, next) => {
  const corsOrigin = c.env.CORS_ORIGIN;
  return cors({
    origin: [corsOrigin],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'], // X-API-Keyヘッダーを許可
  })(c, next);
});

// APIキー認証ミドルウェアを適用
app.use('*', apiKeyAuth);

// ヘルスチェック
app.get('/', (c) => {
  return c.json({ 
    message: 'FCM Web Push Service is running',
    timestamp: new Date().toISOString()
  });
});

// スケジュール通知の設定
app.post('/schedule', async (c) => {
  try {
    const body = await c.req.json() as ScheduledNotification;

    if (!body.fcmToken || !body.scheduledTime || !body.targetHour) {
      return c.json(
        { error: 'fcmToken, scheduledTime, targetHourは必須です' }, 
        400
      );
    }

    // スケジュール時間をチェック
    const scheduledTime = new Date(body.scheduledTime);
    const now = new Date();
    
    if (scheduledTime <= now) {
      return c.json(
        { error: 'スケジュール時間は現在時刻より後である必要があります' }, 
        400
      );
    }

    // Queueに通知データを送信（遅延実行）
    const delayMs = scheduledTime.getTime() - now.getTime();
    
    // dev環境では15秒遅延
    await c.env.SCHEDULED_NOTIFICATIONS_QUEUE.send(body, {
      delaySeconds: c.env.APP_ENV === 'dev' ? 15 : Math.floor(delayMs / 1000)
    });

    return c.json({
      success: true,
      id: `schedule-${Date.now()}`,
      scheduledTime: body.scheduledTime,
      targetHour: body.targetHour,
      message: 'スケジュール通知が設定されました'
    });

  } catch (error) {
    console.error('Error scheduling notification:', error);
    return c.json(
      { error: 'スケジュール設定でエラーが発生しました' }, 
      500
    );
  }
});

// Cloudflare Workers queue consumer
const worker = {
  async fetch(request: Request, env: ExtendedBindings, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },

  async queue(batch: MessageBatch<ScheduledNotification>, env: ExtendedBindings): Promise<void> {
    for (const message of batch.messages) {
      try {
        const notification = message.body;
        
        // 共通の通知送信関数を呼び出し
        await sendNotificationInternal(env, {
          token: notification.fcmToken,
          title: notification.message.title,
          body: notification.message.body,
          icon: notification.message.icon,
          badge: notification.message.badge,
          data: notification.message.data,
        });
        
        message.ack();
        
      } catch (error) {
        console.error('Error processing queue message:', error);
        // エラーの場合はメッセージを再試行キューに戻す
        message.retry();
      }
    }
  }
};

export default worker; 