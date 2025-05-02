//新規登録ページ

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [organization, setOrganization] = useState('');
  const router = useRouter();

  const handleSignUp = async () => {
    setError('');
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedOrganization = organization.trim();

//新規登録ができるか確認する。既に登録されていたり、入力形式が正しくなければエラーメッセージを表示。

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: name,
        role: 'employee',
        organization: trimmedOrganization,
      });
      alert('登録成功');
      router.push('/login');
    } catch (error) {
      console.error('Error during sign-up:', error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
        setError('このメールアドレスはすでに登録されています。別のメールアドレスを使用してください。');
      } else if (error.code === 'auth/invalid-email') {
        setError('メールアドレスの形式が正しくありません。');
      } else if (error.code === 'auth/weak-password') {
        setError('パスワードは6文字以上にしてください。');
      } else {
        setError('登録中にエラーが発生しました。もう一度お試しください。');
      }
    }
  };

  //レイアウト
  return (
    <div className="min-h-screen  bg-[url('/images/background.jpeg')] bg-cover bg-center flex items-center justify-center">

      <div className="bg-white border-4 p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="md:text-3xl text-3xl md:pb-8 pb-6 font-bold">新規登録</h1>
        <p className="text-2xl">メールアドレス</p>
        <input
          type="email"
          placeholder="◯◯◯◯@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 my-2 w-full mb-10"
        />
        <p className="text-2xl">パスワード</p>
        <input
          type="password"
          placeholder="example"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 my-2 w-full mb-10"
        />
        <p className="text-2xl">組織名</p>
        <input
          type="text"
          placeholder="〇〇屋　〇〇店"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          className="border p-2 my-2 w-full mb-10"
        />
        {error && <p className="text-red-500">{error}</p>}
        <button
          onClick={handleSignUp}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 mt-4 w-full"
        >
          新規登録
        </button>
      </div>
    </div>
  );
}
