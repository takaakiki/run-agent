'use client';
import { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
// 正しいパス指定
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';

// タイムを秒数に変換する計算機
const timeToSeconds = (timeStr: string) => {
    if (!timeStr) return Infinity;
    const h = timeStr.match(/(\d+)\s*時間/);
    const m = timeStr.match(/(\d+)\s*分/);
    const s = timeStr.match(/(\d+)\s*秒/);
    return (h ? parseInt(h[1]) * 3600 : 0) + (m ? parseInt(m[1]) * 60 : 0) + (s ? parseInt(s[1]) : 0);
};

function HistoryContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const uid = searchParams.get('uid');
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        if (!uid) { setLoading(false); return; }
        try {
            const q = query(
                collection(db, "archives"),
                where("uid", "==", uid),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const docs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setHistory(docs);
        } catch (error) { console.error("取得失敗:", error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchHistory(); }, [uid]);

    // シューズ別の統計分析
    const shoeStats = useMemo(() => {
        const stats: Record<string, { count: number, bestTime: string, bestSec: number }> = {};
        history.forEach(item => {
            const name = item.shoes || '未設定';
            const sec = timeToSeconds(item.time);
            if (!stats[name]) {
                stats[name] = { count: 0, bestTime: item.time, bestSec: sec };
            }
            stats[name].count += 1;
            if (sec < stats[name].bestSec) {
                stats[name].bestTime = item.time;
                stats[name].bestSec = sec;
            }
        });
        return Object.entries(stats);
    }, [history]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // 削除ボタンクリック時に詳細画面へ飛ぶのを防ぐ
        if (!confirm("この記録を削除しますか？")) return;
        try {
            await deleteDoc(doc(db, "archives", id));
            setHistory(history.filter(item => item.id !== id));
        } catch (error) { console.error(error); }
    };

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">🏃‍♂️</div>;

    return (
        <main className="min-h-screen bg-slate-50 p-3 sm:p-6 font-sans text-slate-900">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-black italic tracking-tighter uppercase">Run Log Archive</h1>
                    <button onClick={() => router.push('/')} className="text-[10px] font-bold text-slate-400 underline">TOP</button>
                </div>

                {/* 統計サマリー */}
                {shoeStats.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {shoeStats.map(([name, stat]) => (
                            <div key={name} className="flex-shrink-0 bg-slate-900 text-white p-3 rounded-2xl min-w-[140px]">
                                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1 truncate">{name}</p>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="text-lg font-black italic">{stat.count}</span>
                                        <span className="text-[8px] ml-1 text-slate-400 font-bold uppercase">Runs</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] text-slate-400 font-bold uppercase leading-none">Best</p>
                                        <p className="text-[10px] font-black italic">{stat.bestTime}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 履歴リスト */}
                {history.length === 0 ? (
                    <div className="bg-white rounded-[24px] p-10 text-center border border-slate-100">
                        <p className="text-slate-400 text-xs font-bold italic">No records found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {history.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => router.push(`/report?id=${item.id}&uid=${uid}`)} // カードクリックで編集へ
                                className="bg-white rounded-[24px] shadow-sm p-5 border border-slate-100 relative group cursor-pointer hover:shadow-md transition-all active:scale-95"
                            >
                                <button
                                    onClick={(e) => handleDelete(e, item.id)}
                                    className="absolute top-4 right-4 text-slate-200 hover:text-red-500 text-xl transition-colors z-10"
                                >
                                    ×
                                </button>
                                <div className="flex justify-between items-center mb-3 pr-6">
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full uppercase">{item.date}</span>
                                    <span className="text-lg font-black italic text-slate-900">{item.time}</span>
                                </div>
                                <h2 className="text-sm font-bold mb-4 leading-tight">{item.event}</h2>
                                <div className="space-y-2 border-t border-slate-50 pt-4 text-[11px] font-bold text-slate-700">
                                    <p>👟 {item.shoes || "未設定"}</p>
                                    <p>🧪 {item.supplements || "なし"}</p>
                                    {item.note && (
                                        <p className="bg-slate-50 p-3 rounded-xl font-medium text-[10px] text-slate-600 italic leading-snug">
                                            "{item.note}"
                                        </p>
                                    )}
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
        <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
            <HistoryContent />
        </Suspense>
    );
}