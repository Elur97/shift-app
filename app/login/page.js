/* ログイン画面*/

'use client';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState(''); 
  const [error, setError] = useState('');
  const [name, setName] = useState(''); 

  // 組織名に基づいて遷移先を決定するルートの定義,組織名が増えたらここを追加してその組織のディレクトリを作成していく。ex.mokuba
  const organizationRoutes = {
    'test': {
      admin: '/test/admin/requests',
      employee: '/test/employee/shift-input'
    },
    'mokuba': {
      admin: '/mokuba/admin/requests',
      employee: '/mokuba/employee/shift-input'
    },
    
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const role = userData?.role;
        const userName = userData?.name; 
        const userOrganization = userData?.organization; 

        setName(userName); // 

        // 組織名の一致チェック
        if (organization.trim() !== userOrganization) {
          setError('組織名が一致しません');
          return;
        }

        // 組織ごとの遷移先を取得し、不足した情報があればif文で条件分岐させる
        if (organizationRoutes[userOrganization]) {
          const route = organizationRoutes[userOrganization][role];
          
          if (route) {
            router.push(route);
          } else {
            setError('不明なユーザータイプです');
          }
        } else {
          setError('指定された組織名に対応するページはありません');
        }
      } else {
        setError('ユーザー情報が見つかりません');
      }
    } catch (error) {
      setError('ログインに失敗しました');
      console.error(error.message);
    }
  };

  //レイアウトコード
  return (
    <div className="min-h-screen  bg-[url('/images/background.jpeg')] bg-cover bg-center flex items-center justify-center">
      <div className="bg-white border-4 p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="md:text-3xl text-3xl md:pb-8 pb-6 font-bold">ログイン</h1>
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
      <button onClick={handleLogin} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 mt-4 w-full">
        ログイン
      </button>
    </div>
    </div>
  )}
