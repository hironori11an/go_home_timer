import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, targetHour } = body;

    if (!token || !targetHour) {
      return NextResponse.json(
        { error: 'FCMトークンと対象時間が必要です' },
        { status: 400 }
      );
    }

    // 現在時刻から次の対象時間（分針）を計算
    const now = new Date();
    const targetMinutes = targetHour * 5; // 1-12 → 5分刻み
    
    // 次回の対象時間を計算
    const nextTargetTime = new Date(now);
    nextTargetTime.setMinutes(targetMinutes, 0, 0);
    
    // もし既に過ぎていたら、次の時間に設定
    if (nextTargetTime <= now) {
      nextTargetTime.setHours(nextTargetTime.getHours() + 1);
    }

    // Cloudflare Workers の /schedule エンドポイントを呼び出す
    const cloudflareWorkerUrl = 'https://fcm-web-push-worker-dev.hironori11an.workers.dev';
    
    const workerResponse = await fetch(`${cloudflareWorkerUrl}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fcmToken: token,
        scheduledTime: nextTargetTime.toISOString(),
        targetHour,
        message: {
          title: '🏠 おうちに帰る時間だよ！',
          body: `長い針が${targetHour}になったよ！お家に帰りましょう🎈`,
          icon: '/icon.png',
          badge: '/badge.png',
          data: {
            type: 'home_timer',
            targetHour: targetHour.toString(),
          }
        }
      })
    });

    if (!workerResponse.ok) {
      const errorText = await workerResponse.text();
      console.error('Cloudflare Worker error:', errorText);
      return NextResponse.json(
        { error: 'スケジュール設定に失敗しました' },
        { status: 500 }
      );
    }

    const result = await workerResponse.json();

    return NextResponse.json({
      success: true,
      scheduledTime: nextTargetTime.toISOString(),
      targetHour,
      workerId: result.id || 'unknown',
      message: 'スケジュール通知が設定されました'
    });

  } catch (error) {
    console.error('Schedule notification error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
} 