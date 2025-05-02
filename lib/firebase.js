import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';  
import { getFirestore, } from 'firebase/firestore'; 



// Firebase 初期化
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
const db = getFirestore(app);


export { db };
