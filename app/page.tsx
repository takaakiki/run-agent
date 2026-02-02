"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import LoginButton from '../components/LoginButton'; // ここも "../" に変更

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true); // 認証チェック中
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'error'>('idle');

  const API_URL = "https://extract-marathon-record-907424102289.asia-northeast2.run.app/analyze";

  // ログイン状態を賢く監視する
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // チェック完了
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.refresh();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setFileName(file.name);
    setStatus('analyzing');

    const mimeType = file.type;

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];

          const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: base64,
              mime_type: mimeType
            }),
          });

          if (!response.ok) throw new Error("解析に失敗しました");

          const result = await response.json();

          // 重要：uid を含めてレポート画面へ送り、紐付けを確実にする
          const params = new URLSearchParams({
            uid: user.uid,
            name: user.displayName || "ランナー",
            event: result.event_name || "不明な大会",
            date: result.event_date || "",
            time: result.time || "00:00:00",
            features: result.course_features || "解析データなし",
            weather: result.weather_info || "データなし"
          }).toString();

          router.push(`/report?${params}`);

        } catch (innerErr) {
          console.error(innerErr);
          setStatus('error');
        }
      };
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  // 1. ロード中（真っ白な画面を防ぐ）
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin text-4xl text-emerald-500">🏃‍♂️</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl overflow-hidden p-8 border border-slate-100">

        <div className="text-center space-y-4 mb-10">
          <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase">ZUBORUNNER</h1>
          <p className="text-slate-500 text-sm font-medium">完走証を解析し、知的資産に変える</p>
        </div>

        {!user ? (
          // 2. 未ログイン：ログインを促す
          <div className="text-center space-y-6 py-8">
            <div className="text-5xl opacity-20">🔐</div>
            <p className="text-slate-600 text-sm">
              自分の記録を安全に管理するために、<br />ログインしてください。
            </p>
            <LoginButton />
          </div>
        ) : (
          // 3. ログイン済み：メイン機能を表示
          <>
            <div className="flex items-center justify-between mb-8 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-xs font-bold text-emerald-700">👤 {user.displayName} さん</span>
              <button
                onClick={handleLogout}
                className="text-[10px] text-emerald-600 hover:text-red-500 font-bold uppercase"
              >
                Logout
              </button>
            </div>

            {status === 'idle' ? (
              <div className="space-y-6">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-200 rounded-[24px] cursor-pointer hover:bg-slate-50 hover:border-emerald-400 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <span className="text-4xl mb-4 group-hover:scale-110 transition-transform text-slate-300 group-hover:text-emerald-400">📄</span>
                    <p className="text-sm text-slate-600 font-bold">完走証をアップロード</p>
                    <p className="text-xs text-slate-400 mt-2">分析してデータベースに保存する</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleFileChange}
                  />
                </label>

                <button
                  onClick={() => router.push(`/history?uid=${user.uid}`)}
                  className="w-full text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors py-2 border-t border-slate-50 pt-6"
                >
                  過去の記録（知的資産）を確認する →
                </button>
              </div>
            ) : status === 'analyzing' ? (
              <div className="text-center py-12 space-y-6">
                <div className="inline-block animate-bounce text-4xl">🏃‍♂️</div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-slate-900">AIがコースを激走中...</h2>
                  <p className="text-sm text-slate-400 font-medium">{fileName} を解析しています</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-6">
                <div className="text-4xl">⚠️</div>
                <h2 className="text-xl font-black text-red-500">解析に失敗しました</h2>
                <button
                  onClick={() => setStatus('idle')}
                  className="bg-slate-900 text-white px-8 py-3 rounded-full text-sm font-bold active:scale-95"
                >
                  もう一度試す
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}