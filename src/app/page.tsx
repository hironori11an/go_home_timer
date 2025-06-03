"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { confirmNotification } from '@/lib/firebase';

export default function Home() {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isTimerSet, setIsTimerSet] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<'loading' | 'success' | 'error' | 'unsupported'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 現在時刻を1秒ごとに更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // FCMトークンの取得
  useEffect(() => {
    const initNotification = async () => {
      try {
        setNotificationStatus('loading');
        const token = await confirmNotification();
        if (token) {
          setFcmToken(token);
          setNotificationStatus('success');
        } else {
          setNotificationStatus('unsupported');
          setErrorMessage('ブラウザが通知をサポートしていないか、権限が拒否されました');
        }
      } catch (error) {
        console.error('Notification initialization error:', error);
        setNotificationStatus('error');
        setErrorMessage(error instanceof Error ? error.message : '通知の初期化に失敗しました');
      }
    };
    
    initNotification();
  }, []);

  // アナログ時計の角度計算
  const getHourAngle = (time: Date) => {
    const hours = time.getHours() % 12;
    const minutes = time.getMinutes();
    return (hours * 30) + (minutes * 0.5); // 30度/時 + 0.5度/分
  };

  const getMinuteAngle = (time: Date) => {
    return time.getMinutes() * 6; // 6度/分
  };

  // タイマー設定
  const setTimer = async () => {
    if (!selectedHour || !fcmToken) return;

    try {
      const response = await fetch('/api/schedule-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: fcmToken,
          targetHour: selectedHour,
        })
      });

      if (response.ok) {
        setIsTimerSet(true);
      }
    } catch (error) {
      console.error('Timer setting error:', error);
    }
  };

  // タイマーリセット
  const resetTimer = () => {
    setIsTimerSet(false);
    setSelectedHour(null);
  };

  const sendTestNotification = async () => {
    if (!fcmToken) {
      alert('FCMトークンが取得されていません');
      return;
    }

    try {
      const response = await fetch('/api/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: fcmToken,
          icon: '/icon.png',
          badge: '/badge.png'
        })
      });

      const result = await response.json();
      console.log('Test notification result:', result);
      alert('テスト通知を送信しました。コンソールを確認してください。');
    } catch (error) {
      console.error('Test notification error:', error);
      alert('テスト通知の送信に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-yellow-100 p-4">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">🏠 おうちタイマー</h1>
          <p className="text-gray-600">長い針がここまで来たらおうちに帰ろうね！</p>
        </div>

        {/* アナログ時計 */}
        <div className="bg-white rounded-full shadow-lg p-8 mb-8 relative">
          <div className="w-64 h-64 mx-auto relative">
            {/* 時計の文字盤 */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-300 bg-white">
              {/* 時間の数字 */}
              {[...Array(12)].map((_, i) => {
                const hour = i + 1;
                const angle = (hour * 30) - 90; // -90度で12時を上に
                const x = Math.cos(angle * Math.PI / 180) * 100;
                const y = Math.sin(angle * Math.PI / 180) * 100;
                
                return (
                  <div
                    key={hour}
                    className="absolute text-xl font-bold text-gray-700"
                    style={{
                      left: `calc(50% + ${x}px - 12px)`,
                      top: `calc(50% + ${y}px - 12px)`,
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {hour}
                  </div>
                );
              })}

              {/* 時針 */}
              <div
                className="absolute bg-gray-700 origin-bottom"
                style={{
                  left: '50%',
                  bottom: '50%',
                  width: '4px',
                  height: '60px',
                  transform: `translateX(-50%) rotate(${getHourAngle(currentTime)}deg)`,
                  transformOrigin: 'bottom center'
                }}
              />

              {/* 分針 */}
              <div
                className={`absolute origin-bottom ${selectedHour && currentTime.getMinutes() >= selectedHour * 5 ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{
                  left: '50%',
                  bottom: '50%',
                  width: '3px',
                  height: '80px',
                  transform: `translateX(-50%) rotate(${getMinuteAngle(currentTime)}deg)`,
                  transformOrigin: 'bottom center'
                }}
              />

              {/* 中心の点 */}
              <div className="absolute bg-gray-800 rounded-full w-3 h-3" style={{
                left: 'calc(50% - 6px)',
                top: 'calc(50% - 6px)'
              }} />

              {/* 選択された時間のマーク */}
              {selectedHour && (
                <div
                  className="absolute bg-red-400 rounded-full w-4 h-4 animate-pulse"
                  style={{
                    left: `calc(50% + ${Math.cos(((selectedHour * 5 * 6) - 90) * Math.PI / 180) * 80}px - 8px)`,
                    top: `calc(50% + ${Math.sin(((selectedHour * 5 * 6) - 90) * Math.PI / 180) * 80}px - 8px)`
                  }}
                />
              )}
            </div>
          </div>

          {/* 現在時刻の表示 */}
          <div className="text-center mt-4">
            <p className="text-lg font-bold text-gray-700">
              {currentTime.toLocaleTimeString('ja-JP', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
          </div>
        </div>

        {!isTimerSet ? (
          /* タイマー設定UI */
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-center mb-4 text-gray-700">
              🕐 長い針がどこまで来たら帰る？
            </h2>
            
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hour) => (
                <button
                  key={hour}
                  onClick={() => setSelectedHour(hour)}
                  className={`p-3 rounded-lg font-bold text-lg transition-all ${
                    selectedHour === hour
                      ? 'bg-red-400 text-white scale-110 shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {hour}
                </button>
              ))}
            </div>

            {selectedHour && (
              <div className="text-center mb-4">
                <p className="text-gray-600">
                  長い針が <span className="font-bold text-red-500">{selectedHour}</span> になったら帰ります
                </p>
              </div>
            )}

            <button
              onClick={setTimer}
              disabled={!selectedHour || notificationStatus !== 'success'}
              className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
                selectedHour && notificationStatus === 'success'
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {notificationStatus === 'loading' ? '準備中...' : 
               notificationStatus !== 'success' ? '通知の許可が必要です' : 
               'タイマーをセット！'}
            </button>
          </div>
        ) : (
          /* タイマー設定完了UI */
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-xl font-bold mb-4 text-green-600">
              タイマーをセットしたよ！
            </h2>
            <p className="text-gray-600 mb-4">
              長い針が <span className="font-bold text-red-500">{selectedHour}</span> になったら
              <br />
              お知らせするからね！
            </p>
            <div className="text-4xl mb-6">🏠</div>
            <button
              onClick={resetTimer}
              className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors"
            >
              タイマーを変更する
            </button>
          </div>
        )}

        {/* 通知ステータス */}
        {notificationStatus !== 'success' && (
          <div className="mt-4 p-4 bg-yellow-100 rounded-lg">
            <p className="text-sm text-yellow-700 text-center">
              {notificationStatus === 'loading' && '通知の準備をしています...'}
              {notificationStatus === 'error' && '通知の設定でエラーが発生しました'}
              {notificationStatus === 'unsupported' && 'このブラウザは通知をサポートしていません'}
            </p>
          </div>
        )}

        {/* プッシュ通知テストセクション */}
        <div className="border border-gray-300 rounded-lg p-6 w-full max-w-md mt-8">
          <h2 className="text-xl font-semibold mb-4">プッシュ通知テスト</h2>
          {notificationStatus === 'loading' && (
            <p className="text-sm text-blue-600">⏳ FCMトークンを取得中...</p>
          )}
          {notificationStatus === 'success' && fcmToken && (
            <div>
              <p className="text-sm text-green-600 mb-4">✅ FCMトークン取得済み</p>
              <p className="text-xs text-gray-500 mb-4 break-all">
                Token: {fcmToken.substring(0, 20)}...
              </p>
              <button
                onClick={sendTestNotification}
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                テスト通知を送信
              </button>
            </div>
          )}
          {(notificationStatus === 'error' || notificationStatus === 'unsupported') && (
            <div>
              <p className="text-sm text-red-600 mb-2">❌ 通知の設定に問題があります</p>
              <p className="text-xs text-gray-600">{errorMessage}</p>
            </div>
          )}
        </div>

        <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </div>
    </div>
  );
}
