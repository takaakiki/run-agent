'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';

function ReportContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const docId = searchParams.get('id');

    const [formData, setFormData] = useState({
        uid: searchParams.get('uid') || '',
        athlete: searchParams.get('name') || '',
        event: searchParams.get('event') || '',
        date: searchParams.get('date') || '',
        time: searchParams.get('time') || '',
        features: searchParams.get('features') || '',
        weather: searchParams.get('weather') || '',
        shoes: '',
        supplements: '', // 補給食
        note: ''         // コメント
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (docId) {
            const fetchDoc = async () => {
                try {
                    const docRef = doc(db, "archives", docId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setFormData(prev => ({ ...prev, ...docSnap.data() as any }));
                    }
                } catch (e) { console.error("データ取得失敗:", e); }
            };
            fetchDoc();
        }
    }, [docId]);

    const handleSave = async () => {
        if (!formData.uid) return alert("ログインが必要です");
        setIsSaving(true);
        try {
            if (docId) {
                await updateDoc(doc(db, "archives", docId), { ...formData, updatedAt: serverTimestamp() });
            } else {
                await addDoc(collection(db, "archives"), { ...formData, createdAt: serverTimestamp() });
            }
            alert("戦術資産としてアーカイブしました！");
            router.push(`/history?uid=${formData.uid}`);
        } catch (e) { alert("保存に失敗しました"); }
        finally { setIsSaving(false); }
    };

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans text-slate-900">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter">Race Report</h1>
                    <button onClick={() => router.push(`/history?uid=${formData.uid}`)} className="text-xs font-bold text-slate-400 underline">← BACK TO HISTORY</button>
                </div>

                <div className="bg-white rounded-[40px] shadow-2xl p-6 sm:p-10 space-y-8 border border-slate-100">

                    <div className="grid grid-cols-2 gap-4 border-b border-slate-50 pb-8">
                        <div>
                            <label className="text-[9px] font-black text-slate-300 uppercase block mb-1">Event / Date</label>
                            <p className="text-sm font-bold leading-tight">{formData.event}</p>
                            <p className="text-[10px] text-slate-400">{formData.date}</p>
                        </div>
                        <div className="text-right">
                            <label className="text-[9px] font-black text-slate-300 uppercase block mb-1">Finish Time</label>
                            <p className="text-3xl font-black text-emerald-500 italic">{formData.time}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 relative">
                            <span className="absolute -top-3 left-6 bg-white px-3 py-1 rounded-full border border-slate-100 text-[10px] font-black text-slate-400">⛰️ COURSE STRATEGY</span>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">{formData.features || "解析中..."}</p>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 relative">
                            <span className="absolute -top-3 left-6 bg-white px-3 py-1 rounded-full border border-slate-100 text-[10px] font-black text-slate-400">🌤️ WEATHER CONDITION</span>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">{formData.weather || "検討中..."}</p>
                        </div>
                    </div>

                    <hr className="border-slate-50" />

                    <div className="space-y-5">
                        <h2 className="text-xs font-black uppercase tracking-widest">Tactical Log</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">👟 シューズ</label>
                                <input
                                    type="text"
                                    placeholder="例：asics メタスピード"
                                    className="w-full p-4 bg-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-400 outline-none"
                                    value={formData.shoes}
                                    onChange={(e) => setFormData({ ...formData, shoes: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">🧪 補給食</label>
                                <input
                                    type="text"
                                    placeholder="例：マグオン×2"
                                    className="w-full p-4 bg-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-400 outline-none"
                                    value={formData.supplements}
                                    onChange={(e) => setFormData({ ...formData, supplements: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">💬 コメント</label>
                            <textarea
                                placeholder="反省・ノウハウを記録..."
                                className="w-full p-4 bg-slate-100 rounded-[32px] text-xs font-medium h-32 focus:ring-2 focus:ring-emerald-400 outline-none resize-none"
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`w-full py-5 rounded-[24px] font-black text-white transition-all shadow-xl ${isSaving ? 'bg-slate-200' : 'bg-slate-900 hover:bg-black'}`}
                    >
                        {isSaving ? "SAVING..." : (docId ? "UPDATE ARCHIVE" : "SAVE TO ARCHIVE")}
                    </button>
                </div>
            </div>
        </main>
    );
}

export default function ReportPage() {
    return <Suspense fallback={<div className="p-20 text-center">LOADING...</div>}><ReportContent /></Suspense>;
}