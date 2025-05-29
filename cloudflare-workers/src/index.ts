import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { FCMService, type Bindings, type FCMMessage } from './fcm';

const app = new Hono<{ Bindings: Bindings }>();

// CORS設定
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://your-frontend-domain.vercel.app'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ヘルスチェック
app.get('/', (c) => {
  return c.json({ 
    message: 'FCM Web Push Service is running',
    timestamp: new Date().toISOString()
  });
});

// 特定のデバイスをターゲットに通知を送信
app.post('/send-notification', async (c) => {
  try {
    const body = await c.req.json() as {
      token: string;
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      data?: Record<string, string>;
      actions?: Array<{
        action: string;
        title: string;
        icon?: string;
      }>;
    };

    if (!body.token || !body.title || !body.body) {
      return c.json(
        { error: 'token, title, bodyは必須です' }, 
        400
      );
    }

    const fcmService = new FCMService(c.env);

    const message: FCMMessage = {
      token: body.token,
      notification: {
        title: body.title,
        body: body.body,
        icon: body.icon,
        badge: body.badge,
      },
      data: body.data,
      webpush: {
        notification: {
          actions: body.actions,
        },
      },
    };

    const response = await fcmService.sendMessage(message);
    const result = await response.json() as { name?: string; error?: { message: string } };

    if (response.ok) {
      return c.json({ 
        success: true, 
        messageId: result.name,
        message: 'プッシュ通知が正常に送信されました'
      });
    } else {
      console.error('FCM Error:', result);
      return c.json(
        { 
          error: 'プッシュ通知の送信に失敗しました', 
          details: result 
        }, 
        response.status as 400 | 401 | 403 | 404 | 500
      );
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return c.json(
      { error: 'サーバーエラーが発生しました' }, 
      500
    );
  }
});

export default app; 