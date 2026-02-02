'use client';

import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../lib/firebase";

export default function LoginButton() {
    const handleLogin = async () => {
        try {
            // ポップアップで Google ログインを実行
            const result = await signInWithPopup(auth, provider);
            // ログインに成功したらユーザー情報を取得
            const user = result.user;
            console.log("ログイン成功！ UID:", user.uid);
            alert(`こんにちは、${user.displayName}さん！\nあなたのIDは ${user.uid} です。`);
        } catch (error) {
            console.error("ログインエラー:", error);
            alert("ログインに失敗しました。");
        }
    };

    return (
        <button
            onClick={handleLogin}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-lg transition duration-300"
        >
            Googleでログイン
        </button>
    );
}