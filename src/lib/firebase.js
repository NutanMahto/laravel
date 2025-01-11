import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "reactchat-39fa7.firebaseapp.com",
  projectId: "reactchat-39fa7",
  storageBucket: "reactchat-39fa7.firebasestorage.app",
  messagingSenderId: "149527799782",
  appId: "1:149527799782:web:20145fd5f7d6d372b59827"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()