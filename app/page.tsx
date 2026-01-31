"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'error'>('idle');

  // バックエンド（Cloud Run）のURL
  const API_URL = "https://extract-marathon-record-907424102289.asia-northeast2.run.app/analyze";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

          const params = new URLSearchParams({
            name: result.athlete_name || "常夏冬太郎",
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

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl overflow-hidden p-8 border border-slate-100">

        <div className="text-center space-y-2 mb-12">
          <h1 className="text-3xl font-black italic tracking-tighter text-slate-900">RunAgent</h1>
          <p className="text-slate-500 text-sm font-medium">完走証を解析し、次戦の武器に変える</p>
        </div>

        {status === 'idle' ? (
          <div className="space-y-6">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-200 rounded-[24px] cursor-pointer hover:bg-slate-50 hover:border-emerald-400 transition-all group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                <span className="text-4xl mb-4 group-hover:scale-110 transition-transform text-slate-300 group-hover:text-emerald-400">📄</span>
                <p className="text-sm text-slate-600 font-bold">完走証をアップロード</p>
                <p className="text-xs text-slate-400 mt-2">JPG / PNG / PDF に対応</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleFileChange}
              />
            </label>

            <button
              onClick={() => router.push('/history?name=常夏冬太郎')}
              className="w-full text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors py-2 border-t border-slate-50 pt-6"
            >
              過去の完走履歴を確認する →
            </button>
          </div>
        ) : status === 'analyzing' ? (
          <div className="text-center py-12 space-y-6">
            <div className="inline-block animate-bounce text-4xl">🏃‍♂️</div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">AI コーチが激走中...</h2>
              <p className="text-sm text-slate-400 font-medium">{fileName} を解析しています</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-6">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-xl font-black text-red-500">解析中にエラーが発生しました</h2>
            <button
              onClick={() => setStatus('idle')}
              className="bg-slate-900 text-white px-8 py-3 rounded-full text-sm font-bold active:scale-95 transition-all"
            >
              もう一度試す
            </button>
          </div>
        )}
      </div>
    </main>
  );
}