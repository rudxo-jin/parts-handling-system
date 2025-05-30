import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// 환경변수가 있으면 사용하고, 없으면 기본값 사용 (안전한 하이브리드 방식)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDPSii5iMEMDpHLY6_O6Ce_u9Wl7RwB9sM",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "parts-handling-system.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "parts-handling-system",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "parts-handling-system.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "315894560260",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:315894560260:web:56703a08172bb551b46751"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app; 