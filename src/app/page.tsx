"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { confirmNotification } from '@/lib/firebase';

export default function Home() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<'loading' | 'success' | 'error' | 'unsupported'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

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
          title: 'テスト通知',
          body: 'これはフロント側からのテスト通知です',
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
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        
        {/* プッシュ通知テストセクション */}
        <div className="border border-gray-300 rounded-lg p-6 w-full max-w-md">
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
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
