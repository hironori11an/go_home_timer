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
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string>('');

  // 動画ファイルのリスト
  const videos = [
    '/videos/superhero-star.mp4',
    '/videos/superhero_three_house_through.mp4',
    '/videos/superhero-go-home.mp4'
  ];

  // タイマーの時刻が過ぎているかチェック
  const isTimeToGoHome = isTimerSet && selectedHour && (() => {
    const currentMinute = currentTime.getMinutes();
    const targetMinute = selectedHour * 5; // 選択された数字 × 5分
    
    return currentMinute >= targetMinute;
  })();

  // ランダムに動画を選択する関数
  const selectRandomVideo = () => {
    const randomIndex = Math.floor(Math.random() * videos.length);
    setSelectedVideo(videos[randomIndex]);
    setIsPlaying(true);
  };

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

  // アナログ時計上でのクリック/タッチ処理
  const handleClockClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isTimerSet) return; // タイマー設定済みの場合は無効
    
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const clickX = event.clientX - centerX;
    const clickY = event.clientY - centerY;
    
    // 角度計算（12時方向を0度とする）
    let angle = Math.atan2(clickY, clickX) * (180 / Math.PI);
    angle = (angle + 90) % 360; // 12時方向を0度に調整
    if (angle < 0) angle += 360;
    
    // 角度から対応する数字を計算（1-12）
    const hour = Math.round(angle / 30) || 12; // 0度の場合は12時
    const finalHour = hour > 12 ? hour - 12 : hour;
    
    setSelectedHour(finalHour);
    
    // 視覚的フィードバック
    const clockElement = event.currentTarget;
    clockElement.style.transform = 'scale(0.98)';
    setTimeout(() => {
      clockElement.style.transform = 'scale(1)';
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-yellow-100 relative overflow-hidden">
      {/* ヘッダー - コンパクトに */}
      <div className="text-center py-4 px-4">
        <h1 className="text-2xl font-bold text-blue-600 mb-1">🏠 おうちタイマー</h1>
        <p className="text-sm text-gray-600">長い針がここまで来たらおうちに帰ろうね！</p>
        {/* タイマー設定の説明 */}
        {!isTimerSet && (
          <div className="text-center mb-4">
            <p className="text-md text-gray-600 mt-2">長い針がその数字まで来たらお知らせします</p>
          </div>
        )}
      </div>

      {/* メイン画面 - アナログ時計を中央に大きく表示 */}
      <div className="flex flex-col items-center justify-center md:justify-start min-h-[calc(100vh-200px)] px-4">


        {/* アナログ時計 - タッチ可能 */}
        <div 
          className={`bg-white rounded-full shadow-2xl p-6 mb-8 relative transition-all duration-200 ${
            !isTimerSet ? 'cursor-pointer hover:shadow-3xl hover:scale-105' : ''
          }`}
          onClick={handleClockClick}
          style={{
            '--clock-radius': '130px',
            '--mark-radius': '90px'
          } as React.CSSProperties & {
            '--clock-radius': string;
            '--mark-radius': string;
          }}
        >
          <div className="w-90 h-90 sm:w-[390px] sm:h-[390px] md:w-[270px] md:h-[270px] lg:w-[320px] lg:h-[320px] mx-auto relative [--clock-radius:130px] [--mark-radius:90px] sm:[--clock-radius:135px] sm:[--mark-radius:95px] md:[--clock-radius:95px] md:[--mark-radius:60px] lg:[--clock-radius:115px] lg:[--mark-radius:70px]">
            {/* 時計の文字盤 */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-300 bg-white">
              {/* 時間の数字 - より大きく */}
              {[...Array(12)].map((_, i) => {
                const hour = i + 1;
                const angle = (hour * 30) - 90; // -90度で12時を上に
                const isSelected = selectedHour === hour;
                
                return (
                  <div
                    key={hour}
                    className={`absolute text-2xl sm:text-3xl md:text-xl lg:text-2xl font-bold transition-all duration-200 ${
                      isSelected 
                        ? 'text-red-500 scale-125 animate-pulse' 
                        : 'text-gray-700 hover:text-blue-500'
                    }`}
                    style={{
                      left: `calc(50% + ${Math.cos(angle * Math.PI / 180)} * var(--clock-radius) - 15px)`,
                      top: `calc(50% + ${Math.sin(angle * Math.PI / 180)} * var(--clock-radius) - 15px)`,
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {hour}
                  </div>
                );
              })}

              {/* 時針 - より太く */}
              <div
                className="absolute bg-gray-700 origin-bottom"
                style={{
                  left: '50%',
                  bottom: '50%',
                  width: '6px',
                  height: '68px',
                  transform: `translateX(-50%) rotate(${getHourAngle(currentTime)}deg)`,
                  transformOrigin: 'bottom center'
                }}
              />

              {/* 分針 - より太く */}
              <div
                className={`absolute origin-bottom ${selectedHour && currentTime.getMinutes() >= selectedHour * 5 ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{
                  left: '50%',
                  bottom: '50%',
                  width: '4px',
                  height: '95px',
                  transform: `translateX(-50%) rotate(${getMinuteAngle(currentTime)}deg)`,
                  transformOrigin: 'bottom center'
                }}
              />

              {/* 中心の点 - より大きく */}
              <div className="absolute bg-gray-800 rounded-full w-4 h-4" style={{
                left: 'calc(50% - 8px)',
                top: 'calc(50% - 8px)'
              }} />

              {/* 選択された時間のマーク */}
              {selectedHour && (
                <div
                  className="absolute bg-red-400 rounded-full w-5 h-5 animate-pulse"
                  style={{
                    left: `calc(50% + ${Math.cos(((selectedHour * 5 * 6) - 90) * Math.PI / 180)} * var(--mark-radius) - 10px)`,
                    top: `calc(50% + ${Math.sin(((selectedHour * 5 * 6) - 90) * Math.PI / 180)} * var(--mark-radius) - 10px)`
                  }}
                />
              )}
            </div>
          </div>

          {/* 現在時刻の表示 */}
          <div className="text-center mt-4">
            <p className="text-xl sm:text-2xl md:text-lg lg:text-xl font-bold text-gray-700">
              {currentTime.toLocaleTimeString('ja-JP', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* タイマー状態に応じた表示 */}
        <div className="min-h-[160px] flex flex-col justify-start">
        {isTimerSet ? (
          /* タイマー設定完了時の表示 */
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4 text-green-600">
              タイマーをセットしたよ！
            </h2>
            <p className="text-gray-600 mb-4">
              長い針が <span className="font-bold text-red-500">{selectedHour}</span> になったら
              <br />
              お知らせするからね！
            </p>
            <button
              onClick={resetTimer}
              className="bg-gray-500 text-white py-3 px-6 rounded-full hover:bg-gray-600 transition-colors text-lg"
            >
              タイマーを変更する
            </button>
          </div>
        ) : selectedHour ? (
          /* 数字選択後の確認画面 */
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-4">
              長い針が <span className="font-bold text-red-500 text-2xl">{selectedHour}</span> になったら帰る
            </p>
            <div className="space-y-3">
              <button
                onClick={setTimer}
                disabled={notificationStatus !== 'success'}
                className={`w-full py-4 px-8 rounded-full font-bold text-lg transition-all transform hover:scale-105 ${
                  notificationStatus === 'success'
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {notificationStatus === 'loading' ? '準備中...' : 
                 notificationStatus !== 'success' ? '通知の許可が必要です' : 
                 'タイマーをセット！'}
              </button>
              <button
                onClick={() => setSelectedHour(null)}
                className="w-full py-2 px-8 rounded-full font-bold text-gray-500 hover:text-gray-700 transition-colors"
              >
                選び直す
              </button>
            </div>
          </div>
        ) : (
          /* 初期状態 */
          <div className="text-center">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-3 shadow-lg">
              <p className="text-base sm:text-lg md:text-xl font-bold text-blue-700 flex items-center justify-center gap-2 whitespace-nowrap">
                <span>☝️</span>
                <span>時計をタッチしてタイマーを設定</span>
              </p>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* 動画再生ボタン - 右下に固定 */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={selectRandomVideo}
          className={`
            font-bold py-4 px-6 rounded-full transition-all transform shadow-lg
            ${isTimeToGoHome 
              ? 'bg-red-500 hover:bg-red-600 text-white animate-bounce text-xl' 
              : 'bg-white hover:bg-gray-50 text-gray-600 border-2 border-gray-300'
            }
          `}
        >
          {isTimeToGoHome ? '🏠 お家へ帰る！' : '🏠 お家へ帰る'}
        </button>
      </div>

      {/* 動画プレーヤー */}
      {isPlaying && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <video
            src={selectedVideo}
            controls
            autoPlay
            className="w-full h-full object-contain"
            onEnded={() => setIsPlaying(false)}
          />
        </div>
      )}

      {/* 通知ステータス - 下部に配置 */}
      {notificationStatus !== 'success' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-yellow-100 border-t border-yellow-200">
          <p className="text-sm text-yellow-700 text-center mb-2">
            {notificationStatus === 'loading' && '通知の準備をしています...'}
            {notificationStatus === 'error' && '通知の設定でエラーが発生しました'}
            {notificationStatus === 'unsupported' && 'このブラウザは通知をサポートしていません'}
          </p>
          
          {/* デバッグ情報 */}
          <div className="text-center">
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
                <div>Service Worker対応: {typeof window !== 'undefined' && 'serviceWorker' in navigator ? 'Yes' : 'No'}</div>
                <div>通知API対応: {typeof window !== 'undefined' && 'Notification' in window ? 'Yes' : 'No'}</div>
                <div>通知許可: {typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'N/A'}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* デバッグ用：成功時も小さく情報表示 */}
      {notificationStatus === 'success' && showDebug && (
        <div className="fixed bottom-4 left-4 p-2 bg-green-50 rounded-lg">
          <div className="text-xs text-green-600">
            <div>✅ 通知設定完了</div>
            <div>トークン: {fcmToken ? `${fcmToken.substring(0, 20)}...` : 'なし'}</div>
          </div>
        </div>
      )}

      {/* 開発者用デバッグボタン */}
      <div className="fixed bottom-4 left-4">
        <button 
          onClick={() => {
            setShowDebug(!showDebug);
          }}
          className="text-xs text-gray-400 hover:text-gray-600 mr-4 bg-white bg-opacity-50 px-2 py-1 rounded"
        >
          🐛
        </button>
        
        {/* テスト通知ボタン */}
        {fcmToken && (
          <button 
            onClick={sendTestNotification}
            className="text-xs text-blue-400 hover:text-blue-600 bg-white bg-opacity-50 px-2 py-1 rounded"
          >
            🔔
          </button>
        )}
      </div>
    </div>
  );
}
