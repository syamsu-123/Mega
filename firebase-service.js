import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, setDoc, query, where } from 'firebase/firestore';
import { db, app, firebaseConfig } from './firebase-config.js';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Reference ke koleksi 'projects'
const projectsCollection = collection(db, 'projects');

// Reference ke koleksi 'testimonials'
// const testimonialsCollection = collection(db, 'testimonials');

// Reference ke koleksi 'news'
const newsCollection = collection(db, 'news');

// Reference ke koleksi 'clients'
const clientsCollection = collection(db, 'clients');

// Reference ke koleksi 'gallery'
const galleryCollection = collection(db, 'gallery');

// Reference ke koleksi 'users' (Untuk Manajemen Tim)
const usersCollection = collection(db, 'users');

// Reference ke koleksi 'materials'
const materialsCollection = collection(db, 'materials');

// Reference ke koleksi 'suppliers'
const suppliersCollection = collection(db, 'suppliers');

// --- Konfigurasi Google Drive via Apps Script ---
// Ganti dengan Web App URL yang Anda dapatkan setelah deploy Google Apps Script
const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbxXwk58ZcWT7iwlPUMIzW_fQHkR_jHEQCMKVs3vIiBNGywbrxF04658pqOnE6m7nr21/exec";

// Upload File Gambar ke Google Drive
export const uploadImageFile = async (file, folderPath = 'uploads') => {
    try {
        // Konversi File ke Base64
        const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });

        // Mengirimkan permintaan POST ke Google Apps Script Web App
        // Menggunakan text/plain untuk menghindari CORS Preflight (OPTIONS request)
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify({
                fileName: `${Date.now()}_${file.name}`,
                mimeType: file.type,
                fileData: base64Data,
                folderPath: folderPath
            })
        });

        const result = await response.json();
        
        if (result.status === 'success') {
            // Gunakan format URL yang lebih stabil terhadap aturan cookie pihak ketiga Google
            const finalUrl = result.fileId ? `https://lh3.googleusercontent.com/d/${result.fileId}` : result.fileUrl;
            return {
                url: finalUrl,
                id: result.fileId || null
            };
        } else {
            console.error("Gagal mengunggah file ke Google Drive: ", result.message);
            return null;
        }
    } catch (error) {
        console.error("Error mengunggah file: ", error);
        return null;
    }
};

// --- CRUD MONITORING MATERIAL ---

export const getMaterialsByProjectId = async (projectId) => {
    try {
        const q = query(materialsCollection, where("projectId", "==", projectId));
        const snapshot = await getDocs(q);
        const materials = [];
        snapshot.forEach((doc) => {
            materials.push({ ...doc.data(), id: doc.id }); // Mencegah ID asli tertimpa oleh id nyasar dari import excel lama
        });
        return materials;
    } catch (error) {
        console.error("Error fetching materials: ", error);
        return [];
    }
};

export const addMaterial = async (materialData) => {
    try {
        const { id, ...cleanData } = materialData; // Cegah field id sementara ikut masuk ke database
        const docRef = await addDoc(materialsCollection, cleanData);
        return { ...cleanData, id: docRef.id };
    } catch (error) {
        console.error("Error adding material: ", error);
        return null;
    }
};

export const updateMaterial = async (id, materialData) => {
    try {
        const { id: ignoreId, ...cleanData } = materialData; // Cegah field id ikut masuk ke database
        await setDoc(doc(db, 'materials', String(id)), cleanData, { merge: true });
        return true;
    } catch (error) {
        console.error("Error updating material: ", error);
        return false;
    }
};

export const deleteMaterial = async (id) => {
    try {
        if (!id || id === 'undefined') return false;
        const cleanId = String(id).trim(); // Membersihkan spasi tak terlihat
        await deleteDoc(doc(db, 'materials', cleanId));
        return true;
    } catch (error) {
        console.error("Error deleting material: ", error);
        return false;
    }
};

// --- CRUD SUPPLIERS ---

export const getSuppliers = async () => {
    try {
        const querySnapshot = await getDocs(suppliersCollection);
        const suppliers = [];
        querySnapshot.forEach((doc) => {
            suppliers.push({ id: doc.id, ...doc.data() });
        });
        return suppliers;
    } catch (error) {
        console.error("Error fetching suppliers: ", error);
        return [];
    }
};

export const addSupplier = async (supplierData) => {
    try {
        const docRef = await addDoc(suppliersCollection, supplierData);
        return { id: docRef.id, ...supplierData };
    } catch (error) {
        console.error("Error adding supplier: ", error);
        return null;
    }
};

export const updateSupplier = async (id, supplierData) => {
    try {
        const docRef = doc(db, 'suppliers', String(id));
        await setDoc(docRef, supplierData, { merge: true });
        return true;
    } catch (error) {
        console.error("Error updating supplier: ", error);
        return false;
    }
};

export const deleteSupplier = async (id) => {
    try {
        const docRef = doc(db, 'suppliers', id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting supplier: ", error);
        return false;
    }
};

// --- CRUD MANAJEMEN TIM (USERS) ---

export const getUsers = async () => {
    try {
        const querySnapshot = await getDocs(usersCollection);
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return users;
    } catch (error) {
        console.error("Error fetching users: ", error);
        return [];
    }
};

export const createAdminUser = async (email, password, name, role) => {
    try {
        // Membuka sesi Firebase App Sekunder agar Admin tidak ter-logout saat registrasi
        const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp_" + Date.now());
        const secondaryAuth = getAuth(secondaryApp);
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        
        await secondaryAuth.signOut();
        await deleteApp(secondaryApp); // Hapus memori App Sekunder

        const docRef = await addDoc(usersCollection, { uid: userCred.user.uid, email, name, role, timestamp: Date.now() });
        return { id: docRef.id, email, name, role };
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
};

export const deleteAdminUser = async (id) => {
    try {
        await deleteDoc(doc(db, 'users', id));
        return true;
    } catch (error) {
        console.error("Error deleting user: ", error);
        return false;
    }
};

export const getUserByEmail = async (email) => {
    try {
        const q = query(usersCollection, where("email", "==", email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        return null;
    } catch (error) {
        console.error("Error fetching user role: ", error);
        return null;
    }
};

// Menghapus File Gambar dari Google Drive
export const deleteImageFile = async (fileId) => {
    if (!fileId) return false;
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify({
                action: 'delete',
                fileId: fileId
            })
        });
        const result = await response.json();
        return result.status === 'success';
    } catch (error) {
        console.error("Error menghapus file dari Drive: ", error);
        return false;
    }
};

// Mendapatkan semua project
export const getProjects = async () => {
    try {
        const querySnapshot = await getDocs(projectsCollection);
        const projects = [];
        querySnapshot.forEach((doc) => {
            projects.push({ id: doc.id, ...doc.data() });
        });
        return projects;
    } catch (error) {
        console.error("Error fetching projects: ", error);
        return [];
    }
};

// Mendapatkan detail project berdasarkan ID
export const getProjectById = async (id) => {
    try {
        const projectDoc = doc(db, 'projects', id);
        const docSnap = await getDoc(projectDoc);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.log("No such project!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching project: ", error);
        return null;
    }
};

// Menambahkan project baru
export const addProject = async (projectData) => {
    try {
        const docRef = await addDoc(projectsCollection, projectData);
        return { id: docRef.id, ...projectData };
    } catch (error) {
        console.error("Error adding project: ", error);
        return null;
    }
};

// Memperbarui project yang ada
export const updateProject = async (id, projectData) => {
    try {
        const projectDoc = doc(db, 'projects', String(id));
        await setDoc(projectDoc, projectData, { merge: true });
        return true;
    } catch (error) {
        console.error("Error updating project: ", error);
        return false;
    }
};

// Menghapus project
export const deleteProject = async (id) => {
    try {
        const projectDoc = doc(db, 'projects', id);
        await deleteDoc(projectDoc);
        return true;
    } catch (error) {
        console.error("Error deleting project: ", error);
        return false;
    }
};

// Mendapatkan semua testimonial
export const getTestimonials = async () => {
    try {
        const querySnapshot = await getDocs(testimonialsCollection);
        const testimonials = [];
        querySnapshot.forEach((doc) => {
            testimonials.push({ id: doc.id, ...doc.data() });
        });
        return testimonials;
    } catch (error) {
        console.error("Error fetching testimonials: ", error);
        return [];
    }
};

// Menambahkan testimoni baru
export const addTestimonial = async (testimonialData) => {
    try {
        const docRef = await addDoc(testimonialsCollection, testimonialData);
        return { id: docRef.id, ...testimonialData };
    } catch (error) {
        console.error("Error adding testimonial: ", error);
        return null;
    }
};

// Memperbarui testimoni yang ada
export const updateTestimonial = async (id, testimonialData) => {
    try {
        const docRef = doc(db, 'testimonials', String(id));
        await setDoc(docRef, testimonialData, { merge: true });
        return true;
    } catch (error) {
        console.error("Error updating testimonial: ", error);
        return false;
    }
};

// Menghapus testimoni
export const deleteTestimonial = async (id) => {
    try {
        const docRef = doc(db, 'testimonials', id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting testimonial: ", error);
        return false;
    }
};

// --- CRUD BERITA / ARTIKEL ---

export const getNews = async () => {
    try {
        const querySnapshot = await getDocs(newsCollection);
        const newsList = [];
        querySnapshot.forEach((doc) => {
            newsList.push({ id: doc.id, ...doc.data() });
        });
        return newsList;
    } catch (error) {
        console.error("Error fetching news: ", error);
        return [];
    }
};

export const addNews = async (newsData) => {
    try {
        const docRef = await addDoc(newsCollection, newsData);
        return { id: docRef.id, ...newsData };
    } catch (error) {
        console.error("Error adding news: ", error);
        return null;
    }
};

export const updateNews = async (id, newsData) => {
    try {
        const docRef = doc(db, 'news', String(id));
        await setDoc(docRef, newsData, { merge: true });
        return true;
    } catch (error) {
        console.error("Error updating news: ", error);
        return false;
    }
};

export const deleteNews = async (id) => {
    try {
        const docRef = doc(db, 'news', id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting news: ", error);
        return false;
    }
};

// --- CRUD KLIEN ---

export const getClients = async () => {
    try {
        const querySnapshot = await getDocs(clientsCollection);
        const clients = [];
        querySnapshot.forEach((doc) => {
            clients.push({ id: doc.id, ...doc.data() });
        });
        return clients;
    } catch (error) {
        console.error("Error fetching clients: ", error);
        return [];
    }
};

export const addClient = async (clientData) => {
    try {
        const docRef = await addDoc(clientsCollection, clientData);
        return { id: docRef.id, ...clientData };
    } catch (error) {
        console.error("Error adding client: ", error);
        return null;
    }
};

export const deleteClient = async (id) => {
    try {
        const docRef = doc(db, 'clients', id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting client: ", error);
        return false;
    }
};

// --- CRUD GALLERY (Dokumentasi Lapangan) ---

export const getGallery = async () => {
    try {
        const querySnapshot = await getDocs(galleryCollection);
        const galleryList = [];
        querySnapshot.forEach((doc) => {
            galleryList.push({ id: doc.id, ...doc.data() });
        });
        return galleryList;
    } catch (error) {
        console.error("Error fetching gallery: ", error);
        return [];
    }
};

export const addGallery = async (galleryData) => {
    try {
        const docRef = await addDoc(galleryCollection, galleryData);
        return { id: docRef.id, ...galleryData };
    } catch (error) {
        console.error("Error adding gallery: ", error);
        return null;
    }
};

export const deleteGallery = async (id) => {
    try {
        const docRef = doc(db, 'gallery', id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting gallery: ", error);
        return false;
    }
};

// Mendapatkan detail berita berdasarkan ID
export const getNewsById = async (id) => {
    try {
        const docRef = doc(db, 'news', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching news detail: ", error);
        return null;
    }
};
