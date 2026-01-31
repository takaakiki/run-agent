"use client";
import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ReportContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const data = {
        // デフォルト値を「常夏冬太郎」に変更
        name: searchParams.get('name') || "常夏冬太郎",
        event: searchParams.get('event') || "大会名不明",
        date: searchParams.get('date') || "",
        time: searchParams.get('time') || "00:00:00",
        features: searchParams.get('features') || "解析データなし",
        weather: searchParams.get('weather') || "データなし",
    };

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
            <div className="max-w-3xl mx-auto space-y-8">

                <div className="flex justify-between items-center">
                    <button onClick={() => router.push('/')} className="text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors">← TOP</button>
                    {/* 解析された名前に基づいて履歴を表示 */}
                    <button onClick={() => router.push(`/history?name=${encodeURIComponent(data.name)}`)} className="bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-700 transition-colors">
                        履歴を見る
                    </button>
                </div>

                <header className="space-y-2">
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Race Report</h1>
                    <p className="text-slate-500 font-medium">{data.event} ({data.date}) の解析結果</p>
                </header>

                <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-100">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Athlete</p>
                            <p className="text-2xl font-bold">{data.name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Finish Time</p>
                            <p className="text-4xl font-black text-emerald-500 tracking-tight">{data.time}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span>⛰️</span> Course Features
                            </h3>
                            <p className="text-slate-600 leading-relaxed bg-slate-50 p-5 rounded-2xl text-sm font-medium">
                                {data.features}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span>🌦️</span> Weather Conditions
                            </h3>
                            <p className="text-slate-600 leading-relaxed bg-slate-50 p-5 rounded-2xl text-sm font-medium">
                                {data.weather}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function ReportPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400 font-bold">Loading report...</div>}>
            <ReportContent />
        </Suspense>
    );
}