import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';  
import { getFirestore, } from 'firebase/firestore'; 

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyBUH3idKE4rj2TW9-4Bg74xm9960lKXhdU",
  authDomain: "shift-app-a06d2.firebaseapp.com",
  projectId: "shift-app-a06d2",
  storageBucket: "shift-app-a06d2.firebasestorage.app",
  messagingSenderId: "1025319104555",
  appId: "1:1025319104555:web:99e13644fd9293b659ba6e",
  measurementId: "G-E3QMLSY0TS"
};

// Firebase 初期化
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
const db = getFirestore(app);


export { db };
