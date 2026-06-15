import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Konfigurasi Firebase Anda
// Pastikan Anda sudah membuat project di Firebase Console (https://console.firebase.google.com/)
// dan mengaktifkan Firestore Database.
// Copy config dari Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
    apiKey: "AIzaSyADbMmTEy3yv0HOT-ANNninThczT3pvooQ",
    authDomain: "megatama-e41d3.firebaseapp.com",
    projectId: "megatama-e41d3",
    storageBucket: "megatama-e41d3.firebasestorage.app",
    messagingSenderId: "70172643509",
    appId: "1:70172643509:web:8bbe31ee858c1f1633aefc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Menggunakan inisialisasi default yang lebih stabil.
// Jika Anda menggunakan database dengan nama custom, tambahkan parameter nama databasenya.
// Contoh jika nama databasenya "megatama-db": const db = getFirestore(app, "megatama-db");
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth, firebaseConfig };
