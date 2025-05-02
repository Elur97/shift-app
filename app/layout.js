//全体のレイアウトを定義

"use client";

import { AuthProvider } from './providers/AuthProvider'; 
import './globals.css'; 
import { Inter } from 'next/font/google';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

const inter = Inter({ subsets: ['latin'] });
const handleLogout = async () => {
  await signOut(auth);
  window.location.href = '/login';
};



export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      <html lang="ja">
        <body className={inter.className}>
          <main className="container mx-auto p-4">{children}</main>
        </body>
      </html>
    </AuthProvider>
  );
}
