/**
 * TSBD (Tuition Service BD) - Centralized Firebase Configuration & Services
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged, 
    signOut, 
    setPersistence, 
    browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    limit, 
    startAfter,
    onSnapshot, 
    serverTimestamp,
    arrayUnion,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export const firebaseConfig = {
    apiKey: "AIzaSyB_22O8J69EUb8rF4FXZrjM-AHgPwOQAtA",
    authDomain: "cms-of-jts.firebaseapp.com",
    projectId: "cms-of-jts",
    storageBucket: "cms-of-jts.firebasestorage.app",
    messagingSenderId: "300970842151",
    appId: "1:300970842151:web:9885ce2a591cf5f4eed602",
    measurementId: "G-TRJNGCB98F"
};

// Initialize Firebase instances
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Authorized Admins
export const ALLOWED_ADMIN_EMAILS = [
    "banglaworld247@gmail.com",
    "gdgourob32@gmail.com"
];

// Helper to verify if user is an admin
export function isAdminUser(user) {
    if (!user || !user.email) return false;
    return ALLOWED_ADMIN_EMAILS.includes(user.email.toLowerCase().trim());
}

// Ensure auth persistence in localStorage
try {
    setPersistence(auth, browserLocalPersistence);
} catch (err) {
    console.warn("Auth persistence error:", err);
}

export {
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    onSnapshot,
    serverTimestamp,
    arrayUnion,
    runTransaction
};
