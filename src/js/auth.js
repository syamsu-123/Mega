import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase-config.js';
import { getUserByEmail } from './firebase-service.js';

// --- Multi-Language System (Google Translate Auto-Switch) ---
function initLoginLanguageToggle() {
    const style = document.createElement('style');
    style.innerHTML = `
        .goog-te-banner-frame.skiptranslate, .skiptranslate > iframe { display: none !important; }
        body { top: 0px !important; }
        #google_translate_element { display: none !important; }
        .goog-tooltip { display: none !important; }
        .goog-tooltip:hover { display: none !important; }
        .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
    `;
    document.head.appendChild(style);

    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({ pageLanguage: 'id', includedLanguages: 'en,id', autoDisplay: false }, 'google_translate_element');
    };
    const gtScript = document.createElement('script');
    gtScript.type = 'text/javascript';
    gtScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(gtScript);

    const gtDiv = document.createElement('div');
    gtDiv.id = 'google_translate_element';
    document.body.appendChild(gtDiv);

    const getCookie = (name) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    };

    let currentLang = getCookie('googtrans') === '/id/en' ? 'EN' : 'ID';

    const handleLangSwitch = (e) => {
        if(e) e.preventDefault();
        const targetLang = currentLang === 'ID' ? '/id/en' : '/id/id';
        document.cookie = `googtrans=${targetLang}; path=/`;
        document.cookie = `googtrans=${targetLang}; domain=.${location.hostname}; path=/`;
        window.location.reload();
    };

    const backBtnContainer = document.querySelector('.absolute.top-6.left-6.z-20') || document.querySelector('.absolute.z-20');
    if (backBtnContainer && !document.getElementById('langToggleLogin')) {
        const langBtn = document.createElement('button');
        langBtn.id = 'langToggleLogin';
        langBtn.className = 'mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white lg:text-slate-500 border border-white/20 lg:border-slate-300 hover:bg-white/10 lg:hover:bg-slate-100 transition-colors backdrop-blur-sm';
        langBtn.innerHTML = `<i class="fas fa-globe"></i> <span>${currentLang === 'ID' ? 'English' : 'Indonesia'}</span>`;
        langBtn.addEventListener('click', handleLangSwitch);
        backBtnContainer.appendChild(langBtn);
    }
}
initLoginLanguageToggle();

document.addEventListener('DOMContentLoaded', () => {
    if (typeof AOS !== 'undefined') AOS.init();

    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Ubah tipe input username menjadi text agar tidak diblokir oleh validasi HTML5 bawaan browser
    if (usernameInput) {
        usernameInput.setAttribute('type', 'text');
        usernameInput.setAttribute('placeholder', 'Email (Admin) atau Kode Proyek (Klien)');
    }

    // Show/Hide Password
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.innerHTML = type === 'password' ? '<i class="fas fa-eye text-gray-400 hover:text-white transition-colors"></i>' : '<i class="fas fa-eye-slash text-gray-400 hover:text-white transition-colors"></i>';
        });
    }

    // Menangani tombol "Login sebagai Klien/Mitra" agar fokus ke input username
    document.querySelectorAll('a, button').forEach(btn => {
        const text = btn.textContent.toLowerCase();
        if (text.includes('klien') || text.includes('mitra')) {
            btn.addEventListener('click', (e) => {
                if (btn.tagName === 'A') e.preventDefault();
                
                if (usernameInput) {
                    usernameInput.focus();
                    
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            title: 'Akses Klien / Mitra',
                            text: 'Silakan gunakan form ini. Masukkan Kode Proyek Anda pada kolom username.',
                            icon: 'info',
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 4000,
                            background: '#0B1F3A',
                            color: '#fff'
                        });
                    }
                }
            });
        }
    });

    // Handle Login Submit
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            let inputValue = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            // Jika input tidak mengandung '@', asumsikan itu adalah Kode Proyek untuk Klien/Mitra
            let email = inputValue;
            if (!inputValue.includes('@')) {
                // Hapus spasi dan jadikan huruf kecil, lalu tambahkan domain dummy khusus mitra
                email = `${inputValue.replace(/\s+/g, '').toLowerCase()}@mitra.megatama.com`;
            }

            if (typeof Swal === 'undefined') {
                let role = 'Viewer';
                if (inputValue.toLowerCase().includes('admin')) role = 'Super Admin';
                else if (inputValue.toLowerCase().includes('manager')) role = 'Project Manager';
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userRole', role);
                localStorage.setItem('userName', inputValue.split('@')[0].toUpperCase());
                if (role === 'Viewer') {
                    localStorage.setItem('projectCode', inputValue.split('@')[0]);
                }
                window.location.href = 'dashboard.html';
                return;
            }

            Swal.fire({
                title: 'Authenticating...',
                text: 'Memverifikasi kredensial Anda ke Firebase',
                allowOutsideClick: false,
                background: '#0B1F3A',
                color: '#fff',
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                let role = 'Viewer';
                let name = inputValue.split('@')[0].toUpperCase();

                // Cek role asli dari database Firestore (Manajemen Tim)
                const userData = await getUserByEmail(user.email);
                if (userData) {
                    role = userData.role || 'Viewer';
                    name = userData.name || name;
                } else {
                    // Fallback untuk akun bawaan yang dibuat langsung di Console
                if (inputValue.toLowerCase().includes('admin')) {
                    role = 'Super Admin';
                } else {
                    // BLOKIR AKSES: Jika data user tidak ada di Firestore (karena sudah dihapus), tolak login
                    await signOut(auth);
                    throw { code: 'auth/account-deleted' };
                }
                }

                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userRole', role);
                localStorage.setItem('userName', name);
                if (role === 'Viewer') {
                    localStorage.setItem('projectCode', inputValue.split('@')[0]);
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Akses Diberikan!',
                    text: `Selamat datang, Anda login sebagai ${role}`,
                    background: '#0B1F3A',
                    color: '#fff',
                    confirmButtonColor: '#1E88E5',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => window.location.href = 'dashboard.html');
            } catch (error) {
                let errorMsg = 'Terjadi kesalahan saat login.';
                if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
                    errorMsg = 'Username / Kode Proyek atau password yang Anda masukkan salah.';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMsg = 'Terlalu banyak percobaan gagal. Silakan coba lagi nanti.';
                }
                
                Swal.fire({
                    icon: 'error',
                    title: 'Akses Ditolak!',
                    text: errorMsg,
                    background: '#0B1F3A',
                    color: '#fff',
                    confirmButtonColor: '#EF4444'
                });
            }
        });
    }
});