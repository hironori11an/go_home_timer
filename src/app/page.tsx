"use client";
import { useEffect, useState } from "react";
import { confirmNotification } from '@/lib/firebase';

export default function Home() {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isTimerSet, setIsTimerSet] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<'loading' | 'success' | 'error' | 'unsupported'>('loading');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);

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
        setDebugInfo('通知の初期化を開始...');
        
        const token = await confirmNotification();
        if (token) {
          setFcmToken(token);
          setNotificationStatus('success');
          setDebugInfo(`トークン取得成功 (長さ: ${token.length})`);
        } else {
          setNotificationStatus('unsupported');
          setDebugInfo('このブラウザは通知をサポートしていません');
        }
      } catch (error) {
        console.error('Notification initialization error:', error);
        setNotificationStatus('error');
        const errorMessage = error instanceof Error ? error.message : String(error);
        setDebugInfo(`エラー: ${errorMessage}`);
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

  // デバッグ用：テスト通知送信
  const sendTestNotification = async () => {
    if (!fcmToken) {
      alert('FCMトークンが取得されていません');
      return;
    }

    try {
      const response = await fetch('/api/schedule-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: fcmToken,
          targetHour: new Date().getHours() + 1, // 1時間後
          isTest: true
        })
      });

      if (response.ok) {
        alert('テスト通知を送信しました');
      } else {
        const errorText = await response.text();
        alert(`テスト通知の送信に失敗しました: ${errorText}`);
      }
    } catch (error) {
      console.error('Test notification error:', error);
      alert(`テスト通知エラー: ${error instanceof Error ? error.message : String(error)}`);
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
            <p className="text-sm text-yellow-700 text-center mb-2">
              {notificationStatus === 'loading' && '通知の準備をしています...'}
              {notificationStatus === 'error' && '通知の設定でエラーが発生しました'}
              {notificationStatus === 'unsupported' && 'このブラウザは通知をサポートしていません'}
            </p>
            
            {/* デバッグ情報 */}
            <div className="mt-2">
              <button 
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs text-blue-600 underline"
              >
                {showDebug ? '詳細を隠す' : '詳細を表示'}
              </button>
              
              {showDebug && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                  <div>ブラウザ: {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}</div>
                  <div>状態: {notificationStatus}</div>
                  <div>詳細: {debugInfo}</div>
                  <div>Service Worker対応: {'serviceWorker' in navigator ? 'Yes' : 'No'}</div>
                  <div>通知API対応: {'Notification' in window ? 'Yes' : 'No'}</div>
                  <div>通知許可: {typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'N/A'}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* デバッグ用：成功時も小さく情報表示 */}
        {notificationStatus === 'success' && showDebug && (
          <div className="mt-4 p-2 bg-green-50 rounded-lg">
            <div className="text-xs text-green-600">
              <div>✅ 通知設定完了</div>
              <div>トークン: {fcmToken ? `${fcmToken.substring(0, 20)}...` : 'なし'}</div>
            </div>
          </div>
        )}

        {/* 開発者用デバッグボタン（常に表示） */}
        <div className="mt-4 text-center">
          <button 
            onClick={() => {
              setShowDebug(!showDebug);
              // コンソールにも詳細情報を出力
              console.log('=== Current State ===');
              console.log('notificationStatus:', notificationStatus);
              console.log('fcmToken:', fcmToken ? `${fcmToken.substring(0, 50)}...` : null);
              console.log('debugInfo:', debugInfo);
              console.log('userAgent:', navigator.userAgent);
              console.log('Notification.permission:', 'Notification' in window ? Notification.permission : 'N/A');
            }}
            className="text-xs text-gray-400 hover:text-gray-600 mr-4"
          >
            🐛 Debug
          </button>
          
          {/* テスト通知ボタン */}
          {fcmToken && (
            <button 
              onClick={sendTestNotification}
              className="text-xs text-blue-400 hover:text-blue-600"
            >
              🔔 テスト通知
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
