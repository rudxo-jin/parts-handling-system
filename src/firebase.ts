import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyDPSii5iMEMDpHLY6_O6Ce_u9Wl7RwB9sM",
  authDomain: "parts-handling-system.firebaseapp.com",
  projectId: "parts-handling-system",
  storageBucket: "parts-handling-system.firebasestorage.app",
  messagingSenderId: "315894560260",
  appId: "1:315894560260:web:56703a08172bb551b46751"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app; 