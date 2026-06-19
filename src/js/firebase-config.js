import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Konfigurasi Firebase Anda
// Pastikan Anda sudah membuat project di Firebase Console (https://console.firebase.google.com/)
// dan mengaktifkan Firestore Database.
// Copy config dari Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Menggunakan inisialisasi default yang lebih stabil.
// Jika Anda menggunakan database dengan nama custom, tambahkan parameter nama databasenya.
// Contoh jika nama databasenya "megatama-db": const db = getFirestore(app, "megatama-db");
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth, firebaseConfig };
