"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function HistoryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. デフォルトの名前を「常夏冬太郎」に変更
    const name = searchParams.get('name') || "常夏冬太郎";

    const HISTORY_API = `https://extract-marathon-record-907424102289.asia-northeast2.run.app/history?name=${encodeURIComponent(name)}`;

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(HISTORY_API);
                if (!res.ok) throw new Error("データの取得に失敗しました");
                const data = await res.json();
                setHistory(data);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [HISTORY_API]);

    const handleCardClick = (record: any) => {
        const params = new URLSearchParams({
            name: record.athlete_name,
            event: record.event_name,
            date: record.event_date,
            time: record.time,
            features: record.course_features,
            weather: record.weather_info
        }).toString();

        router.push(`/report?${params}`);
    };

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">

                <div className="flex justify-between items-center">
                    <button onClick={() => router.push('/')} className="text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors">← TOP</button>
                    <div className="bg-slate-900 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">Archive</div>
                </div>

                <header className="space-y-1">
                    <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 uppercase">Run Log</h1>
                    <p className="text-slate-500 font-medium">{name} 選手の出場全記録</p>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                        <p className="text-slate-400 text-sm font-bold animate-pulse">記録を読み込み中...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-16 text-center border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold">まだ記録がありません。</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {history.map((record, index) => (
                            <div
                                key={index}
                                onClick={() => handleCardClick(record)}
                                className="bg-white rounded-[28px] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 py-1.5 px-4 rounded-full tracking-wider">
                                        {record.event_date}
                                    </span>
                                    <span className="text-xl font-black text-slate-900 group-hover:text-emerald-500 transition-colors">
                                        {record.time}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-6 leading-tight">
                                    {record.event_name}
                                </h3>
                                <div className="space-y-4 pt-6 border-t border-slate-50 text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                                    詳しく見る →
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

export default function HistoryPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading...</div>}>
            <HistoryContent />
        </Suspense>
    );
}