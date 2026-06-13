import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your exact Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7MnFW6S1PLYN2wIZoIBWNnH_ubpaO3uc",
  authDomain: "leetcode-da5ce-rating-v2.firebaseapp.com",
  projectId: "leetcode-da5ce-rating-v2",
  storageBucket: "leetcode-da5ce-rating-v2.firebasestorage.app",
  messagingSenderId: "124544703710",
  appId: "1:124544703710:web:037a1ed0547fcd9ef4f64f",
  measurementId: "G-ELTM4GT0PW",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// (Optional) Initialize Analytics if you want to track page views later
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;

// CRITICAL: Initialize Auth and Firestore, and EXPORT them
export const auth = getAuth(app);
export const db = getFirestore(app);

// Force local persistence so you stay logged in securely across sessions/reloads
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Firebase persistence error:", error);
});
