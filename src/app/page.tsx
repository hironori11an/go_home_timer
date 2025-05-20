"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function Home() {
  const [reminders, setReminders] = useState<string[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js")
          .then(registration => {
            console.log("Service Worker registered with scope:", registration.scope);
            console.log("Service Worker state:", registration.active ? "active" : "inactive");
            if (registration.active) {
              console.log("Service Worker is active and ready to handle notifications");
            }
          })
          .catch(error => {
            console.error("Service Worker registration failed:", error);
          });
      } else {
        console.log("Service Worker is not supported in this browser");
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const handleRemind = () => {
    if (notificationPermission !== "granted") {
      alert("通知が許可されていません。");
      return;
    }
    const reminder = `リマインダー: ${new Date().toLocaleTimeString()}`;
    setReminders([...reminders, reminder]);
    setTimeout(() => {
      new Notification("リマインダー", { body: reminder });
    }, 10000);
  };

  const handleTestNotification = async () => {
    console.log("テスト通知送信ボタンが押されました");
    console.log("現在の通知許可状態:", notificationPermission);
    if (notificationPermission !== "granted") {
      alert("通知が許可されていません。");
      return;
    }
    
    try {
      console.log("Service Workerの登録を確認中...");
      const registration = await navigator.serviceWorker.ready;
      console.log("Service Worker registration:", registration);
      console.log("Service Worker active:", registration.active);
      
      if (!registration.active) {
        throw new Error("Service Worker is not active");
      }

      console.log("通知を送信します...");
      const notification = new Notification("テスト通知", {
        body: "これはテスト通知です。",
        icon: "/icon.png",
        badge: "/badge.png"
      });
      
      notification.onclick = () => {
        console.log("通知がクリックされました");
        window.focus();
      };
      
      console.log("通知の送信が完了しました");
    } catch (error) {
      console.error("通知の送信に失敗しました:", error);
      alert("通知の送信に失敗しました。");
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

        <h1 className="text-2xl font-bold mb-4">リマインダー</h1>
        <div className="mb-4 flex flex-col gap-2 items-center">
          <button
            onClick={handleRequestPermission}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            disabled={notificationPermission === "granted"}
          >
            通知を許可
          </button>
          <span className="text-sm">
            通知の許可状態: {notificationPermission ?? "未取得"}
          </span>
        </div>
        <button
          onClick={handleRemind}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          10秒後にリマインド
        </button>
        <button
          onClick={handleTestNotification}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          テスト通知を送信
        </button>
        <ul className="w-80 bg-white rounded shadow p-4">
          {reminders.length === 0 && <li className="text-gray-400">リマインダーはありません</li>}
          {reminders.map((reminder, idx) => (
            <li key={idx} className="border-b last:border-b-0 py-2">
              {reminder}
            </li>
          ))}
        </ul>
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
