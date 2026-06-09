import { getProjects, updateProject, addProject, deleteProject, getTestimonials, addTestimonial, deleteTestimonial, getClients, addClient, deleteClient, getNews, addNews, deleteNews, getGallery, addGallery, deleteGallery, uploadImageFile, deleteImageFile, getUsers, createAdminUser, deleteAdminUser } from './firebase-service.js';
import { auth } from './firebase-config.js';
import { signOut } from 'firebase/auth';

document.addEventListener('DOMContentLoaded', () => {
    // Cek Autentikasi
    if (!localStorage.getItem('isLoggedIn')) {
        window.location.href = 'login.html';
        return;
    }

    // Dark Mode Initialization
    const themeToggleBtn = document.getElementById('themeToggle');
    
    // Cek preferensi tema dari localStorage
    if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // Mobile Sidebar Toggle Script
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (mobileMenuBtn && sidebar && sidebarOverlay) {
        const toggleSidebar = () => {
            const isClosed = sidebar.classList.contains('-translate-x-full');
            if (isClosed) {
                // Animasi Buka
                sidebarOverlay.classList.remove('hidden');
                setTimeout(() => {
                    sidebarOverlay.classList.remove('opacity-0');
                    sidebar.classList.remove('-translate-x-full');
                }, 10);
                // Ganti ikon menjadi 'X' saat sidebar terbuka
                mobileMenuBtn.innerHTML = '<i class="fas fa-times text-xl"></i>';
            } else {
                // Animasi Tutup (Tunggu animasi pudar 300ms baru sembunyikan)
                sidebarOverlay.classList.add('opacity-0');
                sidebar.classList.add('-translate-x-full');
                setTimeout(() => sidebarOverlay.classList.add('hidden'), 300);
                // Ganti ikon kembali menjadi 'hamburger' saat sidebar tertutup
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars text-xl"></i>';
            }
        };
        
        mobileMenuBtn.addEventListener('click', toggleSidebar);
        sidebarOverlay.addEventListener('click', toggleSidebar);
        
        // Auto close sidebar when a menu item is clicked on mobile
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => { 
                if (window.innerWidth < 1280 && !sidebar.classList.contains('-translate-x-full')) toggleSidebar(); 
            });
        });

    
        // Swipe to close functionality for Dashboard
        let touchStartX = 0;
        let touchEndX = 0;

        const handleSwipe = () => {
            if (touchStartX - touchEndX > 50) { // Swipe ke Kiri
                if (!sidebar.classList.contains('-translate-x-full')) toggleSidebar();
            }
        };
        sidebarOverlay.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX, {passive: true});
        sidebarOverlay.addEventListener('touchend', e => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, {passive: true});
        sidebar.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX, {passive: true});
        sidebar.addEventListener('touchend', e => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, {passive: true});

        // Sembunyikan tombol hamburger di layar besar (desktop)
        const handleResize = () => {
            if (window.innerWidth >= 1280) {
                mobileMenuBtn.classList.add('hidden');
                // Pastikan sidebar mobile tertutup jika layar diperbesar
                if (!sidebar.classList.contains('-translate-x-full')) {
                    toggleSidebar();
                }
            } else {
                mobileMenuBtn.classList.remove('hidden');
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Jalankan saat pertama kali load
    }

    if (themeToggleBtn) updateThemeIcon();

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
            updateThemeIcon();
            initCharts(); // Redraw charts with correct colors
        });
    }

    function updateThemeIcon() {
        if (!themeToggleBtn) return;
        const isDark = document.documentElement.classList.contains('dark');
        themeToggleBtn.innerHTML = isDark ? '<i class="fas fa-sun text-lg"></i>' : '<i class="fas fa-moon text-lg"></i>';
    }

    // Setup User Info & Roles
    const role = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName') || 'User';
    
    if(document.getElementById('userNameDisplay')) document.getElementById('userNameDisplay').innerText = userName;
    if(document.getElementById('heroUserName')) document.getElementById('heroUserName').innerText = userName;
    if(document.getElementById('userRoleDisplay')) document.getElementById('userRoleDisplay').innerText = role;
    if(document.getElementById('userAvatarImg')) document.getElementById('userAvatarImg').src = `https://ui-avatars.com/api/?name=${userName}&background=FF7A00&color=fff&rounded=true`;

    // Sembunyikan fitur admin jika bukan Super Admin
    if (role !== 'Super Admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
    if (role === 'Viewer') {
        document.querySelectorAll('.admin-manager-only').forEach(el => el.style.display = 'none');
        
        // Sembunyikan menu navigasi selain Dashboard dan Proyek untuk Klien
        document.querySelectorAll('.nav-item').forEach(item => {
            const target = item.getAttribute('data-target');
            if (target && target !== 'view-overview' && target !== 'view-projects') {
                item.style.display = 'none';
            }
        });
    }

    // Current Date Display
    if(document.getElementById('currentDate')) {
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('currentDate').innerText = new Date().toLocaleDateString('id-ID', dateOptions);
    }

    // Navigation Routing
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            const target = item.getAttribute('data-target');
            
            views.forEach(v => v.classList.add('hidden'));
            
            // Add slight fade-in animation
            const targetEl = document.getElementById(target);
            if (targetEl) {
                targetEl.classList.remove('hidden');
                targetEl.style.opacity = 0;
                setTimeout(() => targetEl.style.opacity = 1, 50);
            } else {
                console.warn(`Elemen view untuk menu '${target}' tidak ditemukan di HTML.`);
            }

            // Invalidate Map Size if shown to fix Leaflet rendering bug
            if(target === 'view-overview' && map) {
                setTimeout(() => map.invalidateSize(), 100);
            }
        });
    });

    // Init Charts
    initCharts();

    // Load Projects from Firebase
    loadProjectsData();
    if (role !== 'Viewer') {
        loadTestimonialsData();
        loadClientsData();
        loadNewsData();
        loadGalleryData();
        loadUsersData();
    }

    // Search Handler untuk Proyek (Mendeteksi Input Secara Dinamis)
    document.addEventListener('input', (e) => {
        const target = e.target;
        if (target && target.tagName === 'INPUT') {
            const isSearchInput = (target.id && target.id.toLowerCase().includes('search')) || 
                                  (target.type === 'search') || 
                                  (target.placeholder && target.placeholder.toLowerCase().includes('cari'));
            if (isSearchInput) {
                window.currentProjectSearch = target.value;
                if (typeof renderProjectCards === 'function') renderProjectCards();
            }
        }
    });

    // Logout Handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Swal.fire({
                title: 'Keluar dari Sistem?',
                text: "Sesi anda akan diakhiri.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#FF7A00',
                cancelButtonColor: '#2A2A2A',
                confirmButtonText: 'Ya, Logout',
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try { await signOut(auth); } catch(e) { console.error("Error signing out:", e); }
                    localStorage.clear();
                    window.location.href = 'login.html';
                }
            });
        });
    }

    // Setup Cropper for Projects
    const pFileInput = document.getElementById('html-p-file');
    const pCropperContainer = document.getElementById('project-cropper-container');
    const pCropperImage = document.getElementById('project-cropper-image');
    
    if (pFileInput) {
        pFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    pCropperContainer.style.display = 'block';
                    
                    pCropperImage.onload = () => {
                        if (window.projectCropper) {
                            window.projectCropper.destroy();
                        }
                        window.projectCropper = new Cropper(pCropperImage, {
                            viewMode: 1,
                            dragMode: 'move',
                            autoCropArea: 1,
                            cropBoxResizable: true,
                            cropBoxMovable: true,
                            guides: true,
                            center: true,
                            background: true
                        });
                    };
                    pCropperImage.src = event.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                pCropperContainer.style.display = 'none';
                if (window.projectCropper) {
                    window.projectCropper.destroy();
                    window.projectCropper = null;
                }
            }
        });
    }

    // Otomatisasi Perhitungan Minggu Proyek
    const startInput = document.getElementById('html-p-start');
    const endInput = document.getElementById('html-p-end');
    if (startInput && endInput) {
        const updateDuration = () => {
            const durationEl = document.getElementById('html-p-duration');
            const planContainer = document.getElementById('html-p-plan-container');
            const planGrid = document.getElementById('html-p-plan-grid');
            if (startInput.value && endInput.value && durationEl) {
                const start = new Date(startInput.value);
                const end = new Date(endInput.value);
                if (end > start) {
                    const diffTime = Math.abs(end - start);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const diffWeeks = Math.ceil(diffDays / 7);
                    durationEl.innerHTML = `<i class="fas fa-info-circle mr-1"></i> Durasi proyek: <b>${diffDays} Hari</b> (Tercatat <b>${diffWeeks} Minggu</b>).`;
                    
                    if (planContainer && planGrid) {
                        planContainer.classList.remove('hidden');
                        let gridHtml = '';
                        const existingPlans = window.currentEditProjectPlans || {};
                        for (let w = 1; w <= diffWeeks; w++) {
                            const val = existingPlans[w] !== undefined ? existingPlans[w] : '';
                            gridHtml += `<div class="flex flex-col"><span class="text-[10px] text-slate-500 mb-1 font-semibold">Mg ${w}</span><input type="number" min="0" max="100" step="0.01" class="plan-input-week w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-1.5 text-xs outline-none focus:border-[#FF7A00] dark:text-white transition-colors" data-week="${w}" value="${val}"></div>`;
                        }
                        planGrid.innerHTML = gridHtml;
                    }
                } else {
                    durationEl.innerHTML = `<i class="fas fa-exclamation-circle mr-1 text-red-500"></i> <span class="text-red-500">Target selesai harus lebih besar dari tanggal mulai.</span>`;
                    if (planContainer) planContainer.classList.add('hidden');
                }
            } else if (durationEl) { 
                durationEl.innerHTML = ''; 
                if (planContainer) planContainer.classList.add('hidden');
            }
        };
        startInput.addEventListener('change', updateDuration);
        endInput.addEventListener('change', updateDuration);
    }
});

let currentProjects = [];

async function loadProjectsData() {
    try {
        const container = document.getElementById('projectsGrid');
        if (container) container.innerHTML = '<div class="col-span-full text-center py-10"><i class="fas fa-spinner fa-spin text-3xl text-orange-500"></i><p class="mt-3 text-[#A1A1AA]">Memuat data proyek...</p></div>';
        
        let fetchedProjects = await getProjects();
        
        // Filter spesifik untuk Klien (Viewer) yang login pakai Kode Proyek
        const isViewer = localStorage.getItem('userRole') === 'Viewer';
        const projectCodeAuth = localStorage.getItem('projectCode') || localStorage.getItem('userName');
        if (isViewer && projectCodeAuth) {
            const cleanCodeAuth = String(projectCodeAuth).split('@')[0].replace(/\s+/g, '').toUpperCase();
            fetchedProjects = fetchedProjects.filter(p => p.code && String(p.code).replace(/\s+/g, '').toUpperCase() === cleanCodeAuth);
        }
        
        currentProjects = fetchedProjects;
        renderProjectCards();
        updateDashboardStats();
        initCharts(); // Memperbarui grafik agar sinkron dengan data dari Firebase
        initMap();
        if (typeof window.updateActivityFeed === 'function') window.updateActivityFeed();
    } catch (error) {
        console.error("Error loading projects:", error);
    }
}

window.parseAnggaranValue = function(valStr) {
    if (!valStr) return 0;
    let cleanStr = String(valStr).toUpperCase().replace(/RP/g, '').trim();
    let isTriliun = cleanStr.includes('T');
    let isMiliar = cleanStr.includes('M');
    let isJuta = cleanStr.includes('J');
    let isRibu = cleanStr.includes('RIBU') || cleanStr.includes('RB');
    
    const match = cleanStr.match(/[\d,.]+/);
    if (match) {
        let numStr = match[0];
        if (numStr.split('.').length > 2 || (!isTriliun && !isMiliar && !isJuta && !isRibu && numStr.includes('.'))) {
            numStr = numStr.replace(/\./g, '');
        }
        numStr = numStr.replace(',', '.');
        let num = parseFloat(numStr);
        
        if (isTriliun) num *= 1000000000000;
        else if (isMiliar) num *= 1000000000;
        else if (isJuta) num *= 1000000;
        else if (isRibu) num *= 1000;
        
        return num;
    }
    return 0;
};

function updateDashboardStats() {
    let totalAnggaran = 0; // dalam satuan absolut (Rupiah)
    let selesai = 0;
    let berjalan = 0;
    let tertunda = 0;
    let totalProgress = 0;

    currentProjects.forEach(p => {
        // Kalkulasi Anggaran
        if (p.value) {
            totalAnggaran += window.parseAnggaranValue(p.value);
        }

        // Kalkulasi Status
        if (p.status === 'Selesai') selesai++;
        else if (p.status === 'Berjalan') berjalan++;
        else tertunda++; // Ini mencakup "Perencanaan" atau "Tertunda"

        // Akumulasi Progress
        totalProgress += (p.progress || 0);
    });

    const avgProgress = currentProjects.length > 0 ? Math.round(totalProgress / currentProjects.length) : 0;
    
    // Format String Anggaran untuk UI
    let strAnggaran = "Rp 0";
    if (totalAnggaran > 0) {
        strAnggaran = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalAnggaran);
    }

    // DOM Updates
    if(document.getElementById('hero-total-proyek')) document.getElementById('hero-total-proyek').innerHTML = `${berjalan} <span class="text-base font-medium opacity-80">Proyek</span>`;
    if(document.getElementById('hero-overall-progress')) document.getElementById('hero-overall-progress').innerText = `${avgProgress}%`;
    if(document.getElementById('hero-overall-bar')) document.getElementById('hero-overall-bar').style.width = `${avgProgress}%`;
    
    const role = localStorage.getItem('userRole');
    const anggaranEl = document.getElementById('stat-anggaran');
    if (anggaranEl) {
        if (role === 'Viewer') {
            // Sembunyikan elemen kartu (card) terluar yang membungkus stat-anggaran
            const card = anggaranEl.closest('.rounded-2xl') || anggaranEl.closest('.rounded-xl') || anggaranEl.parentElement;
            if (card) card.style.display = 'none';
        } else {
            anggaranEl.innerText = strAnggaran;
        }
    }
    if(document.getElementById('stat-selesai')) document.getElementById('stat-selesai').innerText = selesai;
    if(document.getElementById('stat-berjalan')) document.getElementById('stat-berjalan').innerText = berjalan;
    if(document.getElementById('stat-tertunda')) document.getElementById('stat-tertunda').innerText = tertunda;
}

window.updateActivityFeed = function() {
    const feedContainer = document.getElementById('activity-feed');
    if (!feedContainer) return;

    let activities = [];

    // 1. Ekstrak Data Proyek (Proyek Baru & Update Mingguan)
    if (typeof currentProjects !== 'undefined' && currentProjects.length > 0) {
        currentProjects.forEach(p => {
            activities.push({
                title: 'Proyek Baru',
                desc: `Proyek ${p.name} ditambahkan ke sistem.`,
                timestamp: p.timestamp || (Date.now() - (1000 * 60 * 60 * 24 * 30)), // Fallback waktu jika data lawas
                color: 'bg-blue-500'
            });

            if (p.weeklyUpdates) {
                Object.keys(p.weeklyUpdates).forEach(week => {
                    const update = p.weeklyUpdates[week];
                    activities.push({
                        title: 'Progress Diperbarui',
                        desc: `${p.name}: Progress struktur mencapai ${update.total}%`,
                        note: update.note,
                        timestamp: update.timestamp || (Date.now() - (1000 * 60 * 60 * 24 * 7 * (25 - parseInt(week)))),
                        color: 'bg-orange-500'
                    });
                    
                    if (update.photos && update.photos.length > 0) {
                        activities.push({
                            title: 'Dokumentasi Lapangan',
                            desc: `${p.name}: ${update.photos.length} foto ditambahkan pada Minggu ke-${week}`,
                            timestamp: (update.timestamp || Date.now()) + 1000,
                            color: 'bg-indigo-500'
                        });
                    }
                });
            }
        });
    }

    // 2. Ekstrak Data Portofolio (Portofolio Publik)
    if (typeof currentGallery !== 'undefined' && currentGallery.length > 0) {
        currentGallery.forEach(g => {
            activities.push({
                title: 'Portofolio Publik Diunggah',
                desc: `${g.project || 'Umum'}: ${g.title}`,
                timestamp: g.timestamp || (Date.now() - (1000 * 60 * 60 * 24 * 2)),
                color: 'bg-green-500'
            });
        });
    }

    activities.sort((a, b) => b.timestamp - a.timestamp);
    activities = activities.slice(0, 10); // Ambil 10 teratas

    // Update Notifikasi Lonceng (Hitung aktivitas 7 hari terakhir)
    const recentActivities = activities.filter(act => (Date.now() - act.timestamp) < (7 * 24 * 60 * 60 * 1000));
    const notifContainer = document.getElementById('notificationBadgeContainer');
    const notifCount = document.getElementById('notificationCount');
    if (notifContainer && notifCount) {
        if (recentActivities.length > 0) {
            notifCount.innerText = recentActivities.length > 9 ? '9+' : recentActivities.length;
            notifContainer.classList.remove('hidden');
        } else {
            notifContainer.classList.add('hidden');
        }
    }

    if (activities.length === 0) {
        feedContainer.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 italic mt-2">Belum ada aktivitas terekam.</p>';
        return;
    }

    const timeAgo = (ts) => {
        const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
        if (diff < 60) return 'Baru saja';
        if (diff < 3600) return `${Math.floor(diff/60)} Menit lalu`;
        if (diff < 86400) return `${Math.floor(diff/3600)} Jam lalu`;
        if (diff < 172800) return 'Kemarin';
        return `${Math.floor(diff/86400)} Hari lalu`;
    };

    feedContainer.innerHTML = activities.map(act => `<div class="relative pl-6"><div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full ${act.color} ring-4 ring-white dark:ring-slate-800"></div><p class="text-sm font-semibold text-slate-800 dark:text-white">${act.title}</p><p class="text-xs text-slate-500 mt-1">${act.desc}</p>${act.note ? `<p class="text-[11px] text-slate-400 italic mt-1 line-clamp-1">"${act.note}"</p>` : ''}<span class="text-[10px] text-slate-400 mt-1 block">${timeAgo(act.timestamp)}</span></div>`).join('');
};

let map;
function initMap() {
    if (typeof L === 'undefined') return; // Mencegah crash jika library Leaflet map belum ter-load
    if (!document.getElementById('projectMap')) return; // Mencegah crash jika container id projectMap tidak ada

    if (map) {
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });
    } else {
        map = L.map('projectMap').setView([-6.5, 107.0], 8);
        // CartoDB Dark Matter Base map - premium dark industrial
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO'
        }).addTo(map);
    }
    
    currentProjects.forEach(p => {
        if (p.coords && p.coords.length === 2) {
            let color = p.status === 'Selesai' ? '#22C55E' : (p.status === 'Berjalan' ? '#FF7A00' : '#EF4444');
            let glow = p.status === 'Berjalan' ? 'box-shadow: 0 0 15px 4px rgba(255,122,0,0.6);' : 'box-shadow: 0 0 4px rgba(0,0,0,0.8);';
            let markerHtml = `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid #1A1A1A; ${glow}"></div>`;
            let icon = L.divIcon({ html: markerHtml, className: '' });
            
            L.marker(p.coords, { icon }).addTo(map).bindPopup(`<b>${p.name}</b><br>Progress: ${p.progress || 0}%`);
        }
    });
}

function getColor(p, format = 'class') {
    if (format === 'hex') {
        if(p <= 25) return '#EF4444'; if(p <= 50) return '#FFA726'; if(p <= 75) return '#FF7A00'; return '#22C55E';
    }
    if(p <= 25) return 'text-[#EF4444]'; if(p <= 50) return 'text-[#FFA726]'; if(p <= 75) return 'text-[#FF7A00]'; return 'text-[#22C55E]';
}

function getBgColor(p) {
    if(p <= 25) return 'bg-red-500'; if(p <= 50) return 'bg-amber-500'; if(p <= 75) return 'bg-orange-500'; return 'bg-green-500';
    if(p <= 25) return 'bg-[#EF4444]'; if(p <= 50) return 'bg-[#FFA726]'; if(p <= 75) return 'bg-[#FF7A00]'; return 'bg-[#22C55E]';
}

window.currentProjectSort = window.currentProjectSort || 'newest';
window.currentProjectSearch = window.currentProjectSearch || '';

window.renderProjectCards = renderProjectCards;
function renderProjectCards() {
    const container = document.getElementById('projectsGrid');
    if (!container) return;
    if (currentProjects.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-[#A1A1AA] py-10">Belum ada proyek yang tersedia.</div>';
        return;
    }
    const isViewer = localStorage.getItem('userRole') === 'Viewer';
    
    let displayProjects = [...currentProjects];

    // Filter berdasarkan input search
    if (window.currentProjectSearch.trim() !== '') {
        const query = window.currentProjectSearch.toLowerCase();
        displayProjects = displayProjects.filter(p => 
            (p.name && String(p.name).toLowerCase().includes(query)) ||
            (p.code && String(p.code).toLowerCase().includes(query)) ||
            (p.location && String(p.location).toLowerCase().includes(query)) ||
            (p.client && String(p.client).toLowerCase().includes(query))
        );
    }

    if (window.currentProjectSort === 'newest') {
        displayProjects.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } else if (window.currentProjectSort === 'oldest') {
        displayProjects.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    } else if (window.currentProjectSort === 'progress-high') {
        displayProjects.sort((a, b) => (b.progress || 0) - (a.progress || 0));
    } else if (window.currentProjectSort === 'progress-low') {
        displayProjects.sort((a, b) => (a.progress || 0) - (b.progress || 0));
    }

    const sortControlHTML = `
    <div class="col-span-full flex flex-wrap justify-end items-center mb-4 gap-4">
        <div class="flex items-center gap-2">
            <span class="text-sm text-[#A1A1AA]"><i class="fas fa-sort mr-1"></i>Urutkan:</span>
            <select onchange="window.currentProjectSort = this.value; window.renderProjectCards();" class="bg-[#121212] border border-[#2A2A2A] text-white text-sm rounded-lg p-2 outline-none focus:border-[#FF7A00] transition-colors cursor-pointer">
                <option value="newest" ${window.currentProjectSort === 'newest' ? 'selected' : ''}>Terbaru</option>
                <option value="oldest" ${window.currentProjectSort === 'oldest' ? 'selected' : ''}>Terlama</option>
                <option value="progress-high" ${window.currentProjectSort === 'progress-high' ? 'selected' : ''}>Progress Tertinggi</option>
                <option value="progress-low" ${window.currentProjectSort === 'progress-low' ? 'selected' : ''}>Progress Terendah</option>
            </select>
        </div>
    </div>`;

    let cardsHTML = '';
    if (displayProjects.length === 0) {
        cardsHTML = '<div class="col-span-full text-center text-[#A1A1AA] py-10">Tidak ada proyek yang sesuai kriteria.</div>';
    } else {
        cardsHTML = displayProjects.map(p => {
        const statusBadge = p.status === 'Selesai' ? 'bg-[#22C55E] text-white border-transparent' : 
                            (p.status === 'Berjalan' ? 'bg-[#FF7A00] text-white shadow-[0_0_10px_rgba(255,122,0,0.5)] border-transparent' : 
                            'bg-[#F59E0B] text-white border-transparent');
        
        return `
        <div class="rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-[#2A2A2A] hover:border-[#FF7A00]/50 hover:shadow-[0_8px_30px_rgba(255,122,0,0.15)] transition-all duration-300 cursor-pointer relative overflow-hidden group flex flex-col h-72" onclick="viewDetail('${p.id}')">
            
            ${p.imageUrl ? `
            <img src="${p.imageUrl}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-50 group-hover:opacity-70 z-0">
            <div class="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/80 to-transparent z-0"></div>
            ` : `
            <div class="absolute inset-0 bg-[#1A1A1A] z-0"></div>
            <!-- Ambient Glow -->
            <div class="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-[#FF7A00] rounded-full opacity-0 group-hover:opacity-[0.15] blur-3xl transition-opacity duration-500 z-0"></div>
            `}

            <div class="p-6 flex-1 flex flex-col relative z-10 h-full">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex gap-2">
                        <span class="px-3 py-1 rounded-lg text-xs font-bold ${statusBadge}">${p.status}</span>
                    </div>
                    ${!isViewer ? `<div class="flex gap-2"><button class="w-8 h-8 rounded-full bg-black/50 text-[#A1A1AA] hover:text-[#FF7A00] hover:bg-black transition-all flex items-center justify-center border border-white/10" title="Edit" onclick="event.stopPropagation(); editProyek('${p.id}')"><i class="fas fa-edit text-xs"></i></button>
                    <button class="w-8 h-8 rounded-full bg-red-500/20 text-red-400 hover:text-white hover:bg-red-500 transition-all flex items-center justify-center border border-red-500/30" title="Hapus" onclick="event.stopPropagation(); hapusProyek('${p.id}', '${p.fileId || ''}')"><i class="fas fa-trash text-xs"></i></button></div>` : ''}
                </div>
                
                <div class="mt-auto">
                    <h3 class="text-xl font-bold text-[#FFFFFF] mb-1 group-hover:text-[#FF7A00] transition-colors drop-shadow-md line-clamp-1">${p.name}</h3>
                    <p class="text-gray-300 text-sm mb-4 drop-shadow-md line-clamp-1"><i class="fas fa-map-marker-alt mr-1 text-[#FF7A00]"></i> ${p.location}</p>
                    
                    <div class="flex items-center justify-between border-t border-white/20 pt-4">
                        <div>
                            <p class="text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-wider">Deadline</p>
                            <p class="text-sm font-semibold text-[#FFFFFF]">${p.end || '-'}</p>
                        </div>
                        <div class="flex items-center gap-3 w-1/2 justify-end">
                            <div class="w-full bg-black/50 rounded-full h-2 overflow-hidden border border-white/5">
                                <div class="h-full rounded-full ${p.progress === 100 ? 'bg-[#22C55E]' : (p.progress > 0 ? 'bg-[#FF7A00]' : 'bg-[#FFA726]')}" style="width: ${p.progress}%"></div>
                            </div>
                            <span class="text-sm font-bold text-[#FFFFFF] drop-shadow-md">${p.progress}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        }).join('');
    }

    container.innerHTML = sortControlHTML + cardsHTML;
}

window.currentProjectId = null;
window.viewDetail = function(id) {
    window.currentProjectId = id;
    const p = currentProjects.find(x => String(x.id) === String(id));
    if (!p) return;
    document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
    const detailView = document.getElementById('view-project-detail');
    detailView.classList.remove('hidden');
    detailView.style.opacity = 0;
    setTimeout(() => detailView.style.opacity = 1, 50);

    // Ambil Data Divisi Aktual
    const divSipil = p.divSipil || 0;
    const divArs = p.divArs || 0;
    const divMep = p.divMep || 0;
    const dashOffset = 440 - (440 * p.progress) / 100;
    
    const parsedAnggaran = window.parseAnggaranValue(p.value);
    const displayAnggaran = parsedAnggaran > 900000 
        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parsedAnggaran) 
        : (p.value || '-');

    // Generate Log History secara Dinamis dari Data Update
    let logHtml = '';
    if (p.weeklyUpdates && Object.keys(p.weeklyUpdates).length > 0) {
        const weeks = Object.keys(p.weeklyUpdates).map(Number).sort((a, b) => b - a);
        logHtml = weeks.map((w, i) => {
            const data = p.weeklyUpdates[w];
            const isLatest = i === 0;
            return `
                <div class="relative pl-6">
                    <div class="absolute w-3.5 h-3.5 ${isLatest ? 'bg-[#FF7A00] shadow-[0_0_10px_#FF7A00]' : 'bg-[#2A2A2A]'} rounded-full -left-[8.5px] top-1"></div>
                    <p class="text-xs ${isLatest ? 'text-[#FF7A00]' : 'text-[#A1A1AA]'} font-semibold mb-1">Update Minggu ke-${w}</p>
                    <p class="text-sm text-white font-medium">Total: ${data.total}% <span class="text-xs text-[#A1A1AA] font-normal">(Sipil: ${data.sipil}%, Ars: ${data.ars}%, MEP: ${data.mep}%)</span></p>
                    ${data.note ? `<p class="text-xs text-[#A1A1AA] mt-1.5 leading-relaxed bg-[#121212] p-2.5 rounded-lg border border-[#2A2A2A]">${data.note}</p>` : ''}
                    ${data.photos && data.photos.length > 0 ? `
                    <div class="mt-2 flex flex-wrap gap-2">
                        ${data.photos.map(photo => `
                            <div class="w-12 h-12 rounded-md overflow-hidden border border-[#2A2A2A] cursor-pointer hover:opacity-80 transition-opacity" onclick="viewPhoto('${photo.url}')">
                                <img src="${photo.url}" class="w-full h-full object-cover">
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    } else {
        logHtml = `<p class="text-sm text-[#A1A1AA] italic">Belum ada catatan update.</p>`;
    }

    // Mengambil portofolio lapangan dari data dokumentasi foto progress mingguan
    let projectGallery = [];
    if (p.weeklyUpdates) {
        Object.keys(p.weeklyUpdates).forEach(w => {
            const update = p.weeklyUpdates[w];
            if (update.photos && update.photos.length > 0) {
                update.photos.forEach(photo => {
                    projectGallery.push({
                        imageUrl: photo.url,
                        title: `Minggu ${w}`,
                        timestamp: update.timestamp || 0
                    });
                });
            }
        });
    }
    projectGallery.sort((a, b) => b.timestamp - a.timestamp);
    const recentGallery = projectGallery.slice(0, 4); // Ambil maksimal 4 foto terbaru
    
    let galleryHtml = '';
    if (recentGallery.length > 0) {
        galleryHtml = recentGallery.map(g => `
            <div class="aspect-square rounded-xl bg-[#2A2A2A] border border-[#2A2A2A] overflow-hidden relative group cursor-pointer" onclick="viewPhoto('${g.imageUrl}')">
                <img src="${g.imageUrl}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" alt="${g.title}">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-3">
                    <i class="fas fa-expand text-white text-sm drop-shadow-md mb-1"></i>
                </div>
            </div>
        `).join('');
    } else {
        galleryHtml = '<div class="col-span-2 text-center text-[#A1A1AA] text-sm py-4 italic">Belum ada portofolio.</div>';
    }

    const isViewer = localStorage.getItem('userRole') === 'Viewer';

    detailView.innerHTML = `
        <!-- Header & Toolbar -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div class="flex items-center gap-4">
                <button onclick="closeProjectDetail()" class="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-[#A1A1AA] hover:text-[#FF7A00] hover:border-[#FF7A00] hover:shadow-[0_0_10px_rgba(255,122,0,0.3)] flex items-center justify-center transition-all">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <div>
                    <h2 class="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                        ${p.code ? `<span class="text-[#FF7A00] text-lg">[${p.code}]</span>` : ''}
                        ${p.name}
                        <span class="px-3 py-1 text-xs font-bold rounded-lg ${p.status === 'Selesai' ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20' : (p.status === 'Berjalan' ? 'bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/30 shadow-[0_0_10px_rgba(255,122,0,0.2)]' : 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20')}">${p.status}</span>
                    </h2>
                    <p class="text-[#A1A1AA] text-sm"><i class="fas fa-map-marker-alt text-[#FF7A00] mr-2"></i>${p.location}</p>
                </div>
            </div>
            <div class="flex flex-wrap gap-3">
                ${!isViewer ? `<button onclick="updateProgressSystem('${p.id}')" class="px-4 py-2 rounded-lg bg-[#121212] border border-[#2A2A2A] text-[#FFFFFF] hover:border-[#FF7A00] hover:text-[#FF7A00] transition-all text-sm font-semibold flex items-center gap-2">
                    <i class="fas fa-sync-alt"></i> Update Progress
                </button>` : ''}
                <button onclick="generateReport()" class="px-4 py-2 rounded-lg bg-[#FF7A00] hover:bg-[#FFA726] text-white shadow-[0_0_15px_rgba(255,122,0,0.4)] transition-all text-sm font-bold flex items-center gap-2">
                    <i class="fas fa-file-export"></i> Export Report
                </button>
            </div>
        </div>

        <!-- Main Interface Grid -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-10">
            
            <!-- Left / Main Panel (Span 2) -->
            <div class="xl:col-span-2 space-y-6">
                
                <!-- Analytics Overview -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Circular Overall Progress -->
                    <div class="bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-[#2A2A2A] flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#FF7A00]/30 transition-all">
                        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#FF7A00] rounded-full opacity-[0.05] group-hover:opacity-[0.15] blur-3xl transition-opacity"></div>
                        <h3 class="text-[#A1A1AA] text-sm font-semibold uppercase tracking-wider mb-6">Progress Keseluruhan</h3>
                        <div class="relative w-44 h-44">
                            <svg class="w-full h-full transform -rotate-90 drop-shadow-xl">
                                <circle cx="88" cy="88" r="70" stroke="#2A2A2A" stroke-width="12" fill="transparent" />
                                <circle cx="88" cy="88" r="70" stroke="currentColor" stroke-width="12" fill="transparent" stroke-dasharray="440" stroke-dashoffset="${dashOffset}" class="${getColor(p.progress)}" stroke-linecap="round" style="filter: drop-shadow(0 0 8px currentColor); transition: stroke-dashoffset 2s ease-out;" />
                            </svg>
                            <div class="absolute inset-0 flex flex-col items-center justify-center">
                                <span class="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">${p.progress}%</span>
                            </div>
                        </div>
                    </div>

                    <!-- Project Information Card -->
                    <div class="bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-[#2A2A2A] relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-[#FF7A00] rounded-full opacity-[0.03] blur-2xl"></div>
                        <h3 class="text-[#A1A1AA] text-sm font-semibold uppercase tracking-wider mb-4">Informasi Proyek</h3>
                        <div class="space-y-4 relative z-10">
                            ${p.code ? `<div class="flex justify-between items-center border-b border-[#2A2A2A] pb-3"><span class="text-[#A1A1AA] text-sm"><i class="fas fa-hashtag mr-2 text-center w-5"></i>Kode Proyek</span><span class="text-white font-semibold text-right">${p.code}</span></div>` : ''}
                            <div class="flex justify-between items-center border-b border-[#2A2A2A] pb-3"><span class="text-[#A1A1AA] text-sm"><i class="fas fa-building mr-2 text-center w-5"></i>Klien</span><span class="text-white font-semibold text-right">${p.client}</span></div>
                            <div class="flex justify-between items-center border-b border-[#2A2A2A] pb-3"><span class="text-[#A1A1AA] text-sm"><i class="fas fa-user-tie mr-2 text-center w-5"></i>Project Manager</span><span class="text-white font-semibold text-right">${p.pic}</span></div>
                            ${!isViewer ? `<div class="flex justify-between items-center border-b border-[#2A2A2A] pb-3"><span class="text-[#A1A1AA] text-sm"><i class="fas fa-money-bill-wave mr-2 text-center w-5"></i>Anggaran</span><span class="text-[#FF7A00] font-bold drop-shadow-[0_0_5px_rgba(255,122,0,0.5)] text-right">${displayAnggaran}</span></div>` : ''}
                            <div class="flex justify-between items-center"><span class="text-[#A1A1AA] text-sm"><i class="fas fa-calendar-alt mr-2 text-center w-5"></i>Deadline</span><span class="text-white font-semibold text-right">${p.end}</span></div>
                        </div>
                    </div>
                </div>

                <!-- Division & Milestones Area -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Division Progress Bars -->
                    <div class="bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-[#2A2A2A]">
                        <h3 class="text-[#A1A1AA] text-sm font-semibold uppercase tracking-wider mb-5">Progress Per Divisi</h3>
                        <div class="space-y-6">
                            <div><div class="flex justify-between text-sm mb-2"><span class="text-white font-medium">Sipil</span><span class="font-bold text-[#FF7A00]">${divSipil}%</span></div><div class="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-full h-2.5 overflow-hidden"><div class="bg-[#FF7A00] h-full rounded-full shadow-[0_0_8px_#FF7A00]" style="width: ${divSipil}%"></div></div></div>
                            <div><div class="flex justify-between text-sm mb-2"><span class="text-white font-medium">Arsitektur</span><span class="font-bold text-[#FFA726]">${divArs}%</span></div><div class="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-full h-2.5 overflow-hidden"><div class="bg-[#FFA726] h-full rounded-full shadow-[0_0_8px_#FFA726]" style="width: ${divArs}%"></div></div></div>
                            <div><div class="flex justify-between text-sm mb-2"><span class="text-white font-medium">MEP</span><span class="font-bold text-[#F59E0B]">${divMep}%</span></div><div class="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-full h-2.5 overflow-hidden"><div class="bg-[#F59E0B] h-full rounded-full shadow-[0_0_8px_#F59E0B]" style="width: ${divMep}%"></div></div></div>
                        </div>
                    </div>

                    <!-- M1 - M5 Timeline -->
                    <div class="bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-[#2A2A2A] flex flex-col">
                        <h3 class="text-[#A1A1AA] text-sm font-semibold uppercase tracking-wider mb-auto">Milestone Timeline</h3>
                        <div class="flex justify-between items-center relative mt-8 mb-4">
                            <div class="absolute top-[15px] left-[5%] w-[90%] h-[3px] bg-[#2A2A2A] -z-10"></div>
                            ${[1,2,3,4,5].map(m => {
                                const mProg = p.progress / 100 * 5; 
                                const isDone = mProg >= m;
                                const isCurrent = mProg >= m - 1 && mProg < m;
                                const btnClass = isDone ? 'bg-[#22C55E] text-white shadow-[0_0_10px_rgba(34,197,94,0.5)] border-transparent' : (isCurrent ? 'bg-[#121212] text-[#FF7A00] border-[#FF7A00] shadow-[0_0_15px_rgba(255,122,0,0.6)]' : 'bg-[#121212] border-[#2A2A2A] text-[#A1A1AA]');
                                return `<div class="flex flex-col items-center group cursor-pointer relative" onclick="viewMilestoneData('${p.id}', ${m})"><div class="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${btnClass}">${isDone ? '<i class="fas fa-check"></i>' : 'M'+m}</div><span class="text-[11px] mt-3 font-medium ${isDone || isCurrent ? 'text-white' : 'text-[#A1A1AA]'}">Tahap ${m}</span></div>`
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Weekly Progress Chart -->
                <div class="bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-[#2A2A2A]">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-[#A1A1AA] text-sm font-semibold uppercase tracking-wider">Grafik Progress Mingguan</h3>
                        <select class="bg-[#121212] border border-[#2A2A2A] text-[#A1A1AA] text-xs rounded-lg px-3 py-1.5 focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] outline-none">
                            <option>Bulan Ini</option><option>Kuartal Ini</option><option>Semua Waktu</option>
                        </select>
                    </div>
                    <div class="h-64 w-full relative"><canvas id="detailWeeklyChart"></canvas></div>
                </div>
            </div>

            <!-- Right / Side Panel (Span 1) -->
            <div class="space-y-6">
                
                <!-- Field Documentation -->
                <div class="bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-[#2A2A2A]">
                    <div class="flex justify-between items-center mb-5">
                        <h3 class="text-[#A1A1AA] text-sm font-semibold uppercase tracking-wider">Portofolio Lapangan</h3>
                        <button onclick="viewAllFieldPhotos('${p.id}')" class="text-[#FF7A00] text-xs font-semibold hover:text-[#FFA726] transition-colors">Lihat Semua</button>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        ${galleryHtml}
                    </div>
                </div>

                <!-- Activity History Log -->
                <div class="bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-[#2A2A2A]">
                    <h3 class="text-[#A1A1AA] text-sm font-semibold uppercase tracking-wider mb-6">Log & Catatan Lapangan</h3>
                    <div class="relative border-l-2 border-[#2A2A2A] ml-2 space-y-7 pb-2">
                        ${logHtml}
                    </div>
                </div>

                <!-- Monitoring Material Button -->
                <div class="bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-[#2A2A2A]">
                    <h3 class="text-[#A1A1AA] text-sm font-semibold uppercase tracking-wider mb-4">Logistik & Material</h3>
                    <button onclick="window.location.href='monitoring-material.html?id=${p.id}'" class="w-full bg-[#121212] border border-[#2A2A2A] text-white hover:border-[#FF7A00] hover:text-[#FF7A00] shadow-[0_0_10px_rgba(0,0,0,0.2)] hover:shadow-[0_0_15px_rgba(255,122,0,0.3)] py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                        <i class="fas fa-boxes"></i> Monitoring Material
                    </button>
                </div>
            </div>
        </div>
    `;

    // Init Detail View Chart
    setTimeout(() => {
        const ctx = document.getElementById('detailWeeklyChart');
        if(ctx) {
            if(window.detailChartInst) window.detailChartInst.destroy();
            const projectTotalWeeks = p.totalWeeks || 25;
            const labels = Array.from({length: projectTotalWeeks}, (_, i) => i === projectTotalWeeks - 1 ? 'Mg ' + projectTotalWeeks + ' (Ini)' : 'Mg ' + (i + 1));
            // Menggabungkan data aktual minggu ke grafik (membaca mundur untuk mempertahankan kurva jika minggu tertentu bolong)
            const realisasiData = Array.from({length: projectTotalWeeks}, (_, i) => {
                let val = 0;
                for(let j = i + 1; j >= 1; j--) {
                    if(p.weeklyUpdates && p.weeklyUpdates[j]) { val = p.weeklyUpdates[j].total; break; }
                }
                return val;
            });
            const hasPlans = p.weeklyPlans && Object.keys(p.weeklyPlans).length > 0;
            const rencanaData = Array.from({length: projectTotalWeeks}, (_, i) => {
                if (hasPlans) {
                    let val = 0;
                    for(let j = i + 1; j >= 1; j--) { if(p.weeklyPlans[j] !== undefined) { val = p.weeklyPlans[j]; break; } }
                    return val;
                } else {
                    return Math.min(100, (realisasiData[i] || 0) + 5 + Math.floor(i / 2));
                }
            });
            
            window.detailChartInst = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: 'Realisasi (%)', data: realisasiData, borderColor: '#FF7A00', backgroundColor: 'rgba(255, 122, 0, 0.15)', fill: true, tension: 0.4, pointBackgroundColor: '#FFA726', pointBorderColor: '#FF7A00', borderWidth: 3, pointRadius: 2 }, { label: 'Rencana (%)', data: rencanaData, borderColor: '#64748B', borderDash: [5, 5], backgroundColor: 'transparent', fill: false, tension: 0.4, pointBackgroundColor: '#64748B', pointBorderColor: '#1A1A1A', borderWidth: 2, pointRadius: 2 }] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: true, labels: { color: '#A1A1AA', usePointStyle: true, boxWidth: 8 } }, tooltip: { backgroundColor: '#1A1A1A', titleColor: '#A1A1AA', bodyColor: '#FFFFFF', borderColor: '#2A2A2A', borderWidth: 1 } }, scales: { y: { grid: { color: '#2A2A2A', drawBorder: false }, ticks: { color: '#A1A1AA' }, max: 100 }, x: { grid: { display: false }, ticks: { color: '#A1A1AA', maxTicksLimit: 12 } } } } });
        }
    }, 100);
};

window.viewMilestoneData = function(projectId, m) {
    const p = currentProjects.find(x => String(x.id) === String(projectId));
    if(!p) return;
    
    const targetProgress = m * 20;
    let achievedWeek = null;
    let updateData = null;
    
    if (p.weeklyUpdates) {
        const weeks = Object.keys(p.weeklyUpdates).map(Number).sort((a, b) => a - b);
        for (let w of weeks) {
            if (p.weeklyUpdates[w].total >= targetProgress) {
                achievedWeek = w;
                updateData = p.weeklyUpdates[w];
                break;
            }
        }
    }
    
    const isDark = document.documentElement.classList.contains('dark');

    if (!achievedWeek) {
        Swal.fire({
            title: 'Belum Tercapai', 
            text: 'Tahap ' + m + ' (' + targetProgress + '%) belum tercapai.', 
            icon: 'info',
            background: isDark ? '#1A1A1A' : '#ffffff',
            color: isDark ? '#ffffff' : '#1e293b',
            confirmButtonColor: '#FF7A00'
        });
        return;
    }
    
    let photoHtml = '';
    if (updateData.photos && updateData.photos.length > 0) {
        photoHtml = `
            <div class="mt-4 grid grid-cols-3 gap-2">
                ${updateData.photos.map(ph => `
                    <div class="aspect-square rounded overflow-hidden border border-slate-200 dark:border-[#2A2A2A] cursor-pointer hover:opacity-80 transition-opacity" onclick="Swal.close(); setTimeout(() => viewPhoto('${ph.url}'), 300)">
                        <img src="${ph.url}" class="w-full h-full object-cover">
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    Swal.fire({
        title: `Tahap ${m} Tercapai!`,
        html: `
            <div class="text-left mt-2">
                <p class="text-sm text-slate-500 dark:text-[#A1A1AA] mb-4">Milestone ${targetProgress}% berhasil dicapai pada <span class="font-bold ${isDark ? 'text-white' : 'text-slate-800'}">Minggu ke-${achievedWeek}</span>.</p>
                <div class="flex justify-between items-center mb-2 border-b border-slate-200 dark:border-[#2A2A2A] pb-2">
                    <span class="text-slate-500 dark:text-[#A1A1AA] text-sm font-semibold">Total Progress Mingguan</span>
                    <span class="${isDark ? 'text-white' : 'text-slate-800'} font-bold text-lg">${updateData.total}%</span>
                </div>
                <div class="flex justify-between items-center mb-1">
                    <span class="text-slate-500 dark:text-[#A1A1AA] text-xs">Divisi Sipil</span>
                    <span class="text-[#FF7A00] font-medium text-xs">${updateData.sipil}%</span>
                </div>
                <div class="flex justify-between items-center mb-1">
                    <span class="text-slate-500 dark:text-[#A1A1AA] text-xs">Divisi Arsitektur</span>
                    <span class="text-[#FFA726] font-medium text-xs">${updateData.ars}%</span>
                </div>
                <div class="flex justify-between items-center mb-4">
                    <span class="text-slate-500 dark:text-[#A1A1AA] text-xs">Divisi MEP</span>
                    <span class="text-[#F59E0B] font-medium text-xs">${updateData.mep}%</span>
                </div>
                ${updateData.note ? `
                <div class="mb-2">
                    <span class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold block mb-1">Catatan Lapangan:</span>
                    <div class="bg-slate-50 dark:bg-[#121212] p-3 rounded-lg border border-slate-200 dark:border-[#2A2A2A] text-sm text-slate-500 dark:text-[#A1A1AA] italic">"${updateData.note}"</div>
                </div>
                ` : ''}
                ${photoHtml}
            </div>
        `,
        background: isDark ? '#1A1A1A' : '#ffffff',
        color: isDark ? '#ffffff' : '#1e293b',
        showConfirmButton: true,
        confirmButtonText: 'Tutup',
        confirmButtonColor: '#FF7A00'
    });
};

window.viewAllFieldPhotos = function(projectId) {
    const p = currentProjects.find(x => String(x.id) === String(projectId));
    if(!p) return;
    let allPhotos = [];
    if (p.weeklyUpdates) {
        Object.keys(p.weeklyUpdates).forEach(w => {
            const update = p.weeklyUpdates[w];
            if (update.photos && update.photos.length > 0) {
                update.photos.forEach(photo => allPhotos.push({url: photo.url, title: `Minggu ${w}`}));
            }
        });
    }
    if(allPhotos.length === 0) return Swal.fire('Kosong', 'Belum ada foto dokumentasi lapangan untuk proyek ini.', 'info');
    
    let html = '<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">';
    allPhotos.forEach(ph => {
        html += `<div class="aspect-square rounded-lg overflow-hidden border border-[#2A2A2A] relative cursor-pointer" onclick="viewPhoto('${ph.url}')">
            <img src="${ph.url}" class="w-full h-full object-cover hover:scale-110 transition-transform">
            <p class="text-[10px] text-white absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded">${ph.title}</p>
        </div>`;
    });
    html += '</div>';

    Swal.fire({
        title: 'Semua Dokumentasi Lapangan',
        html: html,
        width: '700px',
        background: document.documentElement.classList.contains('dark') ? '#1A1A1A' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1e293b',
        showConfirmButton: false,
        showCloseButton: true
    });
};

window.updateSwalTotal = function() {
    const chkSipil = document.getElementById('check-sipil');
    const chkArs = document.getElementById('check-ars');
    const chkMep = document.getElementById('check-mep');

    const s = (chkSipil && !chkSipil.checked) ? 0 : (parseFloat(document.getElementById('input-sipil').value) || 0);
    const a = (chkArs && !chkArs.checked) ? 0 : (parseFloat(document.getElementById('input-ars').value) || 0);
    const m = (chkMep && !chkMep.checked) ? 0 : (parseFloat(document.getElementById('input-mep').value) || 0);

    const prevTotal = parseFloat(document.getElementById('swal-prev-total').value) || 0;
    const addedAvg = (s + a + m) / 3;
    const avg = Number((prevTotal + addedAvg).toFixed(2));
    document.getElementById('swal-progress-val').innerText = avg + '%';
    const incEl = document.getElementById('swal-progress-inc');
    if(incEl) {
        incEl.innerText = '(+' + Number(addedAvg.toFixed(2)) + '%)';
    }
};

window.enableEditProgress = function() {
    document.getElementById('input-sipil').disabled = false;
    document.getElementById('input-ars').disabled = false;
    document.getElementById('input-mep').disabled = false;
    document.getElementById('swal-input-note').disabled = false;
    const photoInp = document.getElementById('swal-update-photos');
    if(photoInp) photoInp.disabled = false;

    const chkSipil = document.getElementById('check-sipil');
    const chkArs = document.getElementById('check-ars');
    const chkMep = document.getElementById('check-mep');
    if(chkSipil) chkSipil.disabled = false;
    if(chkArs) chkArs.disabled = false;
    if(chkMep) chkMep.disabled = false;

    const btnSimpan = Swal.getConfirmButton();
    if (btnSimpan) {
        btnSimpan.style.display = 'inline-flex';
        btnSimpan.textContent = 'Update Perubahan';
    }
    
    const statusLabel = document.getElementById('status-minggu');
    if (statusLabel) statusLabel.innerHTML = '<span class="text-blue-500 dark:text-blue-400 text-xs font-bold"><i class="fas fa-edit mr-1"></i>Mode Edit</span>';
};

window.onWeekChange = function(id) {
    const p = currentProjects.find(x => String(x.id) === String(id));
    if(!p) return;
    const minggu = parseInt(document.getElementById('input-minggu').value);
    const data = p.weeklyUpdates && p.weeklyUpdates[minggu];
    
    let prev = { sipil: 0, ars: 0, mep: 0, total: 0, note: '' };
    for(let i = minggu - 1; i >= 1; i--) {
        if(p.weeklyUpdates && p.weeklyUpdates[i]) { prev = p.weeklyUpdates[i]; break; }
    }
    
    const prevTotalEl = document.getElementById('swal-prev-total');
    if (prevTotalEl) prevTotalEl.value = prev.total || 0;

    const inpSipil = document.getElementById('input-sipil');
    const inpArs = document.getElementById('input-ars');
    const inpMep = document.getElementById('input-mep');
    const noteInp = document.getElementById('swal-input-note');
    const photoInp = document.getElementById('swal-update-photos');
    const btnSimpan = Swal.getConfirmButton();
    const statusLabel = document.getElementById('status-minggu');
    
    if(data) {
        inpSipil.value = parseFloat(Math.max(0, data.sipil - prev.sipil).toFixed(2));
        inpArs.value = parseFloat(Math.max(0, data.ars - prev.ars).toFixed(2));
        inpMep.value = parseFloat(Math.max(0, data.mep - prev.mep).toFixed(2));
        noteInp.value = data.note || '';
        
        inpSipil.disabled = true;
        inpArs.disabled = true;
        inpMep.disabled = true;
        noteInp.disabled = true;
        if(photoInp) photoInp.disabled = true;

        const chkSipil = document.getElementById('check-sipil');
        const chkArs = document.getElementById('check-ars');
        const chkMep = document.getElementById('check-mep');
        if(chkSipil) { chkSipil.checked = true; chkSipil.disabled = true; }
        if(chkArs) { chkArs.checked = true; chkArs.disabled = true; }
        if(chkMep) { chkMep.checked = true; chkMep.disabled = true; }

        window.selectedUpdatePhotos = [];
        if (data.photos && data.photos.length > 0) {
            data.photos.forEach(ph => {
                window.selectedUpdatePhotos.push({ url: ph.url, fileId: ph.fileId, existing: true });
            });
        }
        if (typeof window.renderPreviews === 'function') window.renderPreviews();
        
        if (btnSimpan) btnSimpan.style.display = 'none';
        if (statusLabel) statusLabel.innerHTML = '<span class="text-[#22C55E] text-xs font-bold"><i class="fas fa-check-circle mr-1"></i>Sudah Diupdate</span>';
        if (btnSimpan) {
            btnSimpan.style.display = 'none';
            btnSimpan.textContent = 'Simpan Update';
        }
        if (statusLabel) statusLabel.innerHTML = '<span class="text-[#22C55E] text-xs font-bold"><i class="fas fa-check-circle mr-1"></i>Sudah Diupdate</span> <button type="button" onclick="enableEditProgress()" class="ml-2 text-blue-500 hover:text-blue-400 underline text-xs transition-colors">Edit</button>';
    } else {
        inpSipil.value = '';
        inpArs.value = '';
        inpMep.value = '';
        noteInp.value = '';
        
        inpSipil.disabled = false;
        inpArs.disabled = false;
        inpMep.disabled = false;
        noteInp.disabled = false;
        if(photoInp) { photoInp.disabled = false; photoInp.value = ''; }

        const chkSipil = document.getElementById('check-sipil');
        const chkArs = document.getElementById('check-ars');
        const chkMep = document.getElementById('check-mep');
        if(chkSipil) { chkSipil.checked = true; chkSipil.disabled = false; }
        if(chkArs) { chkArs.checked = true; chkArs.disabled = false; }
        if(chkMep) { chkMep.checked = true; chkMep.disabled = false; }

        window.selectedUpdatePhotos = [];
        if (typeof window.renderPreviews === 'function') window.renderPreviews();
        
        if (btnSimpan) btnSimpan.style.display = 'inline-flex';
        if (btnSimpan) {
            btnSimpan.style.display = 'inline-flex';
            btnSimpan.textContent = 'Simpan Update';
        }
        if (statusLabel) statusLabel.innerHTML = '<span class="text-[#FF7A00] text-xs font-bold"><i class="fas fa-edit mr-1"></i>Belum Diupdate</span>';
    }
    updateSwalTotal();
};

window.updateProgressSystem = function(id) {
    if (!window.checkViewerPermission()) return;
    const p = currentProjects.find(x => String(x.id) === String(id));
    if(!p) return;
    
    const isDark = document.documentElement.classList.contains('dark');
    const projectTotalWeeks = p.totalWeeks || 25;
    
    Swal.fire({
        title: 'Update Progress Mingguan',
        width: '500px',
        background: isDark ? '#1A1A1A' : '#ffffff',
        color: isDark ? '#ffffff' : '#1e293b',
        html: `
            <div id="update-form-container" class="mt-4 text-left space-y-5">
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <label class="text-sm font-medium text-slate-800 dark:text-white">Periode Update</label>
                        <div id="status-minggu"></div>
                    </div>
                    <select id="input-minggu" onchange="onWeekChange('${id}')" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] text-slate-800 dark:text-white rounded-lg p-2.5 outline-none focus:border-[#FF7A00] cursor-pointer">
                        ${Array.from({length: projectTotalWeeks}, (_, i) => `<option value="${i+1}">Minggu ke-${i+1}</option>`).join('')}
                    </select>
                </div>
                <input type="hidden" id="swal-prev-total" value="0">
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <label class="block text-sm font-medium text-slate-800 dark:text-white">Penambahan Sipil (%)</label>
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-slate-500">Sertakan</span>
                            <input type="checkbox" id="check-sipil" checked onchange="updateSwalTotal()" class="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 bg-slate-50 dark:bg-[#121212] border-slate-200 dark:border-[#2A2A2A] cursor-pointer">
                        </div>
                    </div>
                    <input type="number" id="input-sipil" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-[#FF7A00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" min="0" max="100" step="0.01" oninput="updateSwalTotal()" placeholder="Contoh: 75.5">
                </div>
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <label class="block text-sm font-medium text-slate-800 dark:text-white">Penambahan Arsitektur (%)</label>
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-slate-500">Sertakan</span>
                            <input type="checkbox" id="check-ars" checked onchange="updateSwalTotal()" class="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 bg-slate-50 dark:bg-[#121212] border-slate-200 dark:border-[#2A2A2A] cursor-pointer">
                        </div>
                    </div>
                    <input type="number" id="input-ars" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-[#FFA726] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" min="0" max="100" step="0.01" oninput="updateSwalTotal()" placeholder="Contoh: 40.25">
                </div>
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <label class="block text-sm font-medium text-slate-800 dark:text-white">Penambahan MEP (%)</label>
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-slate-500">Sertakan</span>
                            <input type="checkbox" id="check-mep" checked onchange="updateSwalTotal()" class="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 bg-slate-50 dark:bg-[#121212] border-slate-200 dark:border-[#2A2A2A] cursor-pointer">
                        </div>
                    </div>
                    <input type="number" id="input-mep" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-[#F59E0B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" min="0" max="100" step="0.01" oninput="updateSwalTotal()" placeholder="Contoh: 80">
                </div>
                
                <div class="bg-slate-50 dark:bg-[#121212] p-4 rounded-xl border border-slate-200 dark:border-[#2A2A2A] text-center mt-6">
                    <p class="text-xs text-slate-500 dark:text-[#A1A1AA] uppercase tracking-wider font-semibold mb-1">Estimasi Progress Keseluruhan</p>
                    <div class="flex items-center justify-center gap-2">
                        <div class="text-3xl font-black text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" id="swal-progress-val">0%</div>
                        <div class="text-sm font-bold text-[#22C55E]" id="swal-progress-inc">(+0%)</div>
                    </div>
                </div>
                
                <div class="mt-4">
                    <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] mb-2">Catatan Lapangan</label>
                    <textarea id="swal-input-note" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-xl p-3 text-slate-800 dark:text-white outline-none focus:border-[#FF7A00] transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed" rows="3" placeholder="Contoh: Pengecoran tahap 2 selesai..."></textarea>
                </div>
                <div class="mt-4">
                    <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] mb-2">Dokumentasi Foto (Maks 10)</label>
                    <input type="file" id="swal-update-photos" multiple accept="image/*" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2 outline-none text-slate-800 dark:text-white file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 dark:file:bg-[#FF7A00]/20 dark:file:text-[#FF7A00] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    <div id="update-photos-preview" class="mt-3 flex flex-wrap gap-2"></div>
                    <p id="update-photos-count" class="text-xs text-[#FF7A00] mt-1 font-medium"></p>
                </div>
            </div>
            
            <div id="update-cropper-container" style="display: none;" class="mt-4">
                <div class="mb-3 text-left">
                    <button type="button" onclick="cancelCropUpdatePhoto()" class="text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"><i class="fas fa-arrow-left mr-1"></i> Batal Crop</button>
                </div>
                <div style="width: 100%; max-height: 350px; overflow: hidden; border-radius: 0.5rem; border: 1px solid #2A2A2A;">
                    <img id="update-cropper-image" style="max-width: 100%; display: block;">
                </div>
                <div class="mt-4 flex justify-end">
                    <button type="button" onclick="saveCroppedUpdatePhoto()" class="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-orange-500/30 transition-colors">Simpan Crop</button>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#FF7A00',
        cancelButtonColor: isDark ? '#2A2A2A' : '#64748B',
        confirmButtonText: 'Simpan Update',
        cancelButtonText: 'Batal',
        didOpen: () => {
            window.selectedUpdatePhotos = [];
            
            if(!p.weeklyUpdates) p.weeklyUpdates = {};
            const updatedWeeks = Object.keys(p.weeklyUpdates).map(Number);
            const maxWeek = updatedWeeks.length > 0 ? Math.max(...updatedWeeks) : 0;
            const defaultWeek = maxWeek < projectTotalWeeks ? maxWeek + 1 : projectTotalWeeks;
            document.getElementById('input-minggu').value = defaultWeek;
            onWeekChange(id);
            
            const photoInput = document.getElementById('swal-update-photos');
            if (photoInput) {
                photoInput.addEventListener('change', (e) => {
                    const newFiles = Array.from(e.target.files);
                    if (window.selectedUpdatePhotos.length + newFiles.length > 10) {
                        Swal.showValidationMessage('Total maksimal 10 foto!');
                        photoInput.value = '';
                        return;
                    }
                    Swal.resetValidationMessage();
                    newFiles.forEach(file => {
                        window.selectedUpdatePhotos.push({ file: file, url: URL.createObjectURL(file) });
                    });
                    window.renderPreviews();
                    photoInput.value = '';
                });
            }
        },
        preConfirm: () => {
            if (window.selectedUpdatePhotos.length > 10) {
                Swal.showValidationMessage('Maksimal 10 foto yang diperbolehkan!');
                return false;
            }
            
            const chkSipil = document.getElementById('check-sipil');
            const chkArs = document.getElementById('check-ars');
            const chkMep = document.getElementById('check-mep');
            
            const valSipil = parseFloat(document.getElementById('input-sipil').value) || 0;
            const valArs = parseFloat(document.getElementById('input-ars').value) || 0;
            const valMep = parseFloat(document.getElementById('input-mep').value) || 0;

            if (chkSipil && !chkSipil.checked && valSipil > 0) {
                Swal.showValidationMessage('Peringatan: Checklist Sipil tidak dicentang tetapi ada nilainya!');
                return false;
            }
            if (chkArs && !chkArs.checked && valArs > 0) {
                Swal.showValidationMessage('Peringatan: Checklist Arsitektur tidak dicentang tetapi ada nilainya!');
                return false;
            }
            if (chkMep && !chkMep.checked && valMep > 0) {
                Swal.showValidationMessage('Peringatan: Checklist MEP tidak dicentang tetapi ada nilainya!');
                return false;
            }
            
            return true;
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            const minggu = parseInt(document.getElementById('input-minggu').value);
            
            const chkSipil = document.getElementById('check-sipil');
            const chkArs = document.getElementById('check-ars');
            const chkMep = document.getElementById('check-mep');

            const addSipil = (chkSipil && !chkSipil.checked) ? 0 : (parseFloat(document.getElementById('input-sipil').value) || 0);
            const addArs = (chkArs && !chkArs.checked) ? 0 : (parseFloat(document.getElementById('input-ars').value) || 0);
            const addMep = (chkMep && !chkMep.checked) ? 0 : (parseFloat(document.getElementById('input-mep').value) || 0);
            const note = document.getElementById('swal-input-note').value;
            
            let prev = { sipil: 0, ars: 0, mep: 0, total: 0 };
            for(let i = minggu - 1; i >= 1; i--) {
                if(p.weeklyUpdates && p.weeklyUpdates[i]) { prev = p.weeklyUpdates[i]; break; }
            }
            
            const newSipil = Math.min(100, Number((prev.sipil + addSipil).toFixed(2)));
            const newArs = Math.min(100, Number((prev.ars + addArs).toFixed(2)));
            const newMep = Math.min(100, Number((prev.mep + addMep).toFixed(2)));
            const newProgress = Math.min(100, Number(((newSipil + newArs + newMep) / 3).toFixed(2)));
            
            if(!p.weeklyUpdates) p.weeklyUpdates = {};
            
            Swal.fire({ 
                title: 'Menyimpan...', 
                text: 'Mengupdate server dan mengunggah foto...', 
                background: isDark ? '#1A1A1A' : '#ffffff',
                color: isDark ? '#ffffff' : '#1e293b',
                allowOutsideClick: false, 
                didOpen: () => Swal.showLoading() 
            });
            
            let uploadedPhotos = [];
            if (window.selectedUpdatePhotos && window.selectedUpdatePhotos.length > 0) {
                for (let i = 0; i < window.selectedUpdatePhotos.length; i++) {
                    const item = window.selectedUpdatePhotos[i];
                    if (item.existing) {
                        uploadedPhotos.push({ url: item.url, fileId: item.fileId || null });
                    } else if (item.file) {
                        const uploadResult = await uploadImageFile(item.file, 'projects');
                        if (uploadResult && uploadResult.url) { uploadedPhotos.push({ url: uploadResult.url, fileId: uploadResult.id || null }); }
                    }
                }
            }

            p.weeklyUpdates[minggu] = { sipil: newSipil, ars: newArs, mep: newMep, total: newProgress, note: note, timestamp: Date.now(), photos: uploadedPhotos };
            
            const updatedWeeks = Object.keys(p.weeklyUpdates).map(Number);
            const maxWeek = Math.max(...updatedWeeks);
            
            // Hanya override keseluruhan jika minggu yg di-update adalah minggu paling akhir/tertinggi
            if (minggu === maxWeek) {
                p.divSipil = newSipil;
                p.divArs = newArs;
                p.divMep = newMep;
                p.progress = newProgress;
                
                if (newProgress === 100) p.status = 'Selesai';
                else if (newProgress > 0) p.status = 'Berjalan';
                else p.status = 'Perencanaan';
            }
            
            const projectDataToUpdate = { ...p };
            delete projectDataToUpdate.id; // Hapus ID agar tidak redundan dalam field document di Firestore
            
            updateProject(id, projectDataToUpdate).then((success) => {
                if (success) {
                    // Re-render UI dashboard & detail agar langsung berubah
                    renderProjectCards();
                    viewDetail(id);
                    Swal.fire({ 
                        icon: 'success', 
                        title: 'Update Berhasil', 
                        text: 'Progress proyek (Minggu ke-' + minggu + ') telah diubah menjadi ' + newProgress + '%', 
                        background: isDark ? '#1A1A1A' : '#ffffff',
                        color: isDark ? '#ffffff' : '#1e293b',
                        confirmButtonColor: '#FF7A00' 
                    });
                } else {
                    Swal.fire({ 
                        icon: 'error', 
                        title: 'Gagal', 
                        text: 'Terjadi kesalahan saat mengupdate server.',
                        background: isDark ? '#1A1A1A' : '#ffffff',
                        color: isDark ? '#ffffff' : '#1e293b'
                    });
                }
            });
        }
    });
};

// ==========================================
// INTEGRASI MANAJEMEN TIM (USERS)
// ==========================================

let currentUsers = [];
async function loadUsersData() {
    try {
        const container = document.getElementById('usersListContainer');
        if (!container) return;
        container.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin text-2xl text-orange-500"></i></div>';
        currentUsers = await getUsers();
        renderUsers();
    } catch (error) { console.error(error); }
}

function renderUsers() {
    const container = document.getElementById('usersListContainer');
    if (!container) return;
    if (currentUsers.length === 0) {
        container.innerHTML = '<div class="text-center text-slate-500 py-4">Belum ada user tambahan.</div>';
        return;
    }
    
    container.innerHTML = currentUsers.map(u => {
        let roleBadge = 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
        if (u.role === 'Project Manager') roleBadge = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        else if (u.role === 'Super Admin') roleBadge = 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
        
        // Untuk klien (Viewer), kita tampilkan sebagai 'Kode Proyek' tanpa domain di UI jika itu domain dummy mitra
        let displayEmail = u.email;
        if (u.role === 'Viewer' && displayEmail.includes('@mitra.megatama.com')) {
            displayEmail = `Kode Proyek: ${displayEmail.split('@')[0].toUpperCase()}`;
        }

        return `
        <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#121212] rounded-xl border border-slate-100 dark:border-[#2A2A2A]">
            <div class="flex items-center gap-4">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=random&color=fff" class="w-10 h-10 rounded-full" alt="avatar">
                <div>
                    <p class="font-bold text-slate-800 dark:text-white">${u.name}</p>
                    <p class="text-xs text-slate-500">${displayEmail}</p>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <span class="px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold ${roleBadge}">${u.role}</span>
                <button onclick="hapusUser('${u.id}')" class="w-8 h-8 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center border border-red-100 dark:border-red-500/20" title="Hapus Akses">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </div>
        </div>
        `;
    }).join('');
}

window.tambahUser = function() {
    if (!window.checkAdminPermission('menambah pengguna baru')) return;
    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
        title: 'Tambah Anggota Tim',
        background: isDark ? '#1A1A1A' : '#ffffff',
        color: isDark ? '#ffffff' : '#1e293b',
        html: `
            <input id="swal-u-name" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white" placeholder="Nama Lengkap">
            <input id="swal-u-email" type="text" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white" placeholder="Email (untuk Admin) / Kode Proyek (untuk Klien)">
            <div class="relative mb-3">
                <input id="swal-u-pass" type="password" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 pr-10 outline-none text-slate-800 dark:text-white" placeholder="Password (Min. 6 Karakter)">
                <button type="button" id="toggle-swal-pass" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-orange-500 transition-colors">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
            <select id="swal-u-role" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white cursor-pointer">
                <option value="Project Manager">Project Manager</option>
                <option value="Viewer">Viewer (Klien)</option>
                <option value="Super Admin">Super Admin</option>
            </select>
        `,
        showCancelButton: true,
        confirmButtonColor: '#FF7A00',
        cancelButtonColor: isDark ? '#2A2A2A' : '#64748B',
        confirmButtonText: 'Simpan',
        didOpen: () => {
            const toggleBtn = document.getElementById('toggle-swal-pass');
            const passInput = document.getElementById('swal-u-pass');
            if (toggleBtn && passInput) {
                toggleBtn.addEventListener('click', () => {
                    const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
                    passInput.setAttribute('type', type);
                    toggleBtn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
                });
            }
                const roleSelect = document.getElementById('swal-u-role');
                const emailInput = document.getElementById('swal-u-email');
                if (roleSelect && emailInput) {
                    roleSelect.addEventListener('change', (e) => {
                        if (e.target.value === 'Viewer') {
                            emailInput.placeholder = 'Kode Proyek Klien (Cth: PRJ-001)';
                        } else {
                            emailInput.placeholder = 'Alamat Email Lengkap';
                        }
                    });
                }
        },
        preConfirm: () => {
            const name = document.getElementById('swal-u-name').value;
                let email = document.getElementById('swal-u-email').value;
            const pass = document.getElementById('swal-u-pass').value;
            const role = document.getElementById('swal-u-role').value;
                if (!name || !email || !pass) { Swal.showValidationMessage('Nama, Email/Kode Proyek, dan Password wajib diisi!'); return false; }
            if (pass.length < 6) { Swal.showValidationMessage('Password minimal 6 karakter!'); return false; }
                
                if (role === 'Viewer' && !email.includes('@')) {
                    email = `${email.replace(/\s+/g, '').toLowerCase()}@mitra.megatama.com`;
                } else if (role !== 'Viewer' && !email.includes('@')) {
                    Swal.showValidationMessage('Masukkan format email yang valid untuk Admin/Manager!'); return false;
                }

            return { name, email, pass, role };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Mendaftarkan User...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            try {
                await createAdminUser(result.value.email, result.value.pass, result.value.name, result.value.role);
                Swal.fire('Berhasil!', 'User baru telah ditambahkan dan dapat digunakan untuk login.', 'success');
                loadUsersData();
            } catch(error) {
                let errMsg = 'Terjadi kesalahan saat memproses data.';
                if (error.code === 'auth/email-already-in-use') errMsg = 'Email sudah terdaftar di sistem!';
                Swal.fire('Gagal!', errMsg, 'error');
            }
        }
    });
}

window.hapusUser = function(id) {
    if (!window.checkAdminPermission('menghapus pengguna')) return;
    Swal.fire({
        title: 'Cabut Akses User?',
        text: "User ini tidak akan bisa login atau melihat data lagi.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'Ya, Hapus'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            deleteAdminUser(id).then(success => {
                if (success) { Swal.fire('Terhapus!', 'Hak akses user dicabut.', 'success'); loadUsersData(); }
                else { Swal.fire('Gagal!', 'Terjadi kesalahan.', 'error'); }
            });
        }
    });
};

window.selectedUpdatePhotos = [];

window.renderPreviews = function() {
    const previewContainer = document.getElementById('update-photos-preview');
    const countText = document.getElementById('update-photos-count');
    if (!previewContainer || !countText) return;
    
    previewContainer.innerHTML = '';
    if (window.selectedUpdatePhotos.length > 0) {
        countText.innerText = `Terpilih ${window.selectedUpdatePhotos.length} dari maksimal 10 foto.`;
    } else {
        countText.innerText = '';
    }
    
    window.selectedUpdatePhotos.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'relative w-16 h-16 rounded-md overflow-hidden border border-[#2A2A2A] group';
        div.innerHTML = `
            <img src="${item.url}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                ${item.existing ? '' : `<button type="button" class="text-white hover:text-[#FF7A00]" onclick="cropUpdatePhoto(${index})" title="Crop"><i class="fas fa-crop-alt"></i></button>`}
                <button type="button" class="text-white hover:text-red-500" onclick="removeUpdatePhoto(${index})" title="Hapus"><i class="fas fa-trash"></i></button>
            </div>
        `;
        previewContainer.appendChild(div);
    });
};

window.removeUpdatePhoto = function(index) {
    if (window.selectedUpdatePhotos[index] && window.selectedUpdatePhotos[index].existing) {
        if (!window.checkAdminPermission('menghapus dokumentasi lapangan eksisting')) return;
    }
    window.selectedUpdatePhotos.splice(index, 1);
    window.renderPreviews();
};

window.cropUpdatePhoto = function(index) {
    const cropperContainer = document.getElementById('update-cropper-container');
    const cropperImage = document.getElementById('update-cropper-image');
    const formContainer = document.getElementById('update-form-container');
    
    cropperImage.src = window.selectedUpdatePhotos[index].url;
    
    formContainer.style.display = 'none';
    cropperContainer.style.display = 'block';
    
    const swalConfirm = Swal.getConfirmButton();
    const swalCancel = Swal.getCancelButton();
    if (swalConfirm) swalConfirm.style.display = 'none';
    if (swalCancel) swalCancel.style.display = 'none';
    
    if (window.updatePhotoCropper) window.updatePhotoCropper.destroy();
    
    window.updatePhotoCropper = new Cropper(cropperImage, { viewMode: 1, dragMode: 'move', autoCropArea: 1, cropBoxResizable: true, cropBoxMovable: true, guides: true, center: true, background: true });
    window.currentCropIndex = index;
};

window.saveCroppedUpdatePhoto = function() {
    if (window.updatePhotoCropper && window.currentCropIndex !== undefined) {
        window.updatePhotoCropper.getCroppedCanvas({ maxWidth: 1200, maxHeight: 1200, fillColor: '#ffffff' }).toBlob((blob) => {
            const croppedFile = new File([blob], "cropped_update.jpg", { type: "image/jpeg" });
            const idx = window.currentCropIndex;
            window.selectedUpdatePhotos[idx].file = croppedFile;
            window.selectedUpdatePhotos[idx].url = URL.createObjectURL(croppedFile);
            
            window.cancelCropUpdatePhoto();
            window.renderPreviews();
        }, 'image/jpeg', 0.85);
    }
};

window.cancelCropUpdatePhoto = function() {
    const cropperContainer = document.getElementById('update-cropper-container');
    const formContainer = document.getElementById('update-form-container');
    
    if (cropperContainer) cropperContainer.style.display = 'none';
    if (formContainer) formContainer.style.display = 'block';
    
    const swalConfirm = Swal.getConfirmButton();
    const swalCancel = Swal.getCancelButton();
    if (swalConfirm) swalConfirm.style.display = 'inline-flex';
    if (swalCancel) swalCancel.style.display = 'inline-flex';
    
    if (window.updatePhotoCropper) { window.updatePhotoCropper.destroy(); window.updatePhotoCropper = null; }
    window.currentCropIndex = undefined;
};

window.closeProjectDetail = function() {
    document.getElementById('view-project-detail').classList.add('hidden');
    const viewGrid = document.getElementById('view-projects');
    if(viewGrid) {
        viewGrid.classList.remove('hidden');
        viewGrid.style.opacity = 0;
        setTimeout(() => viewGrid.style.opacity = 1, 50);
    } else {
        document.querySelector('.view-section').classList.remove('hidden');
    }
};

window.switchView = function(viewId) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
    const targetEl = document.getElementById(viewId);
    targetEl.classList.remove('hidden');
    targetEl.style.opacity = 0;
    setTimeout(() => targetEl.style.opacity = 1, 50);
}

let chartsInstance = [];
function initCharts() {
    if (typeof Chart === 'undefined') return; // Mencegah crash jika script Chart.js belum ter-load

    // Deteksi Tema agar warna teks & grid di Chart menyesuaikan Light / Dark Mode
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? '#2A2A2A' : '#E2E8F0';
    const textColor = isDark ? '#A1A1AA' : '#64748B';

    // Destroy existing instances if changing themes
    chartsInstance.forEach(c => c.destroy());
    chartsInstance = [];

    // --- 1. Kalkulasi Data Status Proyek (Pie Chart) ---
    let countBerjalan = 0, countSelesai = 0, countTertunda = 0;
    currentProjects.forEach(p => {
        if (p.status === 'Selesai') countSelesai++;
        else if (p.status === 'Berjalan') countBerjalan++;
        else countTertunda++;
    });
    const pieData = currentProjects.length > 0 ? [countBerjalan, countSelesai, countTertunda] : [0, 0, 0];

    // --- 2. Kalkulasi Trend Progress Keseluruhan (Line Chart) ---
    let lineLabels = [];
    let lineData = [];
    let linePlanData = [];

    if (currentProjects.length > 0) {
        let maxWeek = 0;
        currentProjects.forEach(p => {
            if (p.weeklyUpdates) {
                const weeks = Object.keys(p.weeklyUpdates).map(Number);
                if (weeks.length > 0) maxWeek = Math.max(maxWeek, ...weeks);
            }
        });

        if (maxWeek === 0) {
            lineLabels = ['Mg 1', 'Mg 2', 'Mg 3', 'Mg 4'];
            lineData = [0, 0, 0, 0];
            linePlanData = [0, 0, 0, 0];
        } else {
            // Ambil maksimal 8 minggu terakhir agar grafik tidak terlalu berdesakan
            const startWeek = Math.max(1, maxWeek - 7);
            for (let w = startWeek; w <= maxWeek; w++) {
                lineLabels.push('Mg ' + w);
                let totalProg = 0;
                let totalPlan = 0;
                currentProjects.forEach(p => {
                    let progAtW = 0;
                    // Cari progress proyek di minggu 'w', atau jika belum diupdate cari di minggu sebelumnya
                    for (let i = w; i >= 1; i--) {
                        if (p.weeklyUpdates && p.weeklyUpdates[i]) { progAtW = p.weeklyUpdates[i].total; break; }
                    }
                    totalProg += progAtW;
                    
                    let planAtW = 0;
                    const hasPlans = p.weeklyPlans && Object.keys(p.weeklyPlans).length > 0;
                    if (hasPlans) {
                        for (let i = w; i >= 1; i--) {
                            if (p.weeklyPlans[i] !== undefined) { planAtW = p.weeklyPlans[i]; break; }
                        }
                    } else {
                        planAtW = Math.min(100, progAtW + 5 + Math.floor(w / 2));
                    }
                    totalPlan += planAtW;
                });
                lineData.push(Number((totalProg / currentProjects.length).toFixed(2)));
                linePlanData.push(Number((totalPlan / currentProjects.length).toFixed(2)));
            }
        }
    } else {
        lineLabels = ['Mg 1', 'Mg 2', 'Mg 3', 'Mg 4'];
        lineData = [0, 0, 0, 0];
        linePlanData = [0, 0, 0, 0];
    }

    const lineCtx = document.getElementById('lineChart');
    if(lineCtx) {
        chartsInstance.push(new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: lineLabels,
                datasets: [
                    { label: 'Rata-rata Realisasi (%)', data: lineData, borderColor: '#FF7A00', backgroundColor: 'rgba(255, 122, 0, 0.15)', fill: true, tension: 0.4, pointBackgroundColor: '#FFA726', pointBorderColor: '#FF7A00', borderWidth: 3 },
                    { label: 'Rata-rata Rencana (%)', data: linePlanData, borderColor: '#64748B', borderDash: [5, 5], backgroundColor: 'transparent', fill: false, tension: 0.4, pointBackgroundColor: '#64748B', pointBorderColor: '#1A1A1A', borderWidth: 2 }
                ]
            },
            options: { 
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: true, labels: { color: textColor, usePointStyle: true, boxWidth: 8 } } },
                scales: { 
                    y: { grid: { color: gridColor }, ticks: { color: textColor }, min: 0, max: 100 },
                    x: { grid: { display: false }, ticks: { color: textColor } }
                }
            }
        }));
    }
    const pieCtx = document.getElementById('pieChart');
    if(pieCtx) {
        chartsInstance.push(new Chart(pieCtx, { 
            type: 'doughnut', 
            data: { labels: ['Berjalan', 'Selesai', 'Tertunda'], datasets: [{ data: pieData, backgroundColor: ['#FF7A00', '#22C55E', '#EF4444'], borderWidth: 0, hoverOffset: 6 }] }, 
            options: { 
                responsive: true, maintainAspectRatio: false, cutout: '75%',
                plugins: { legend: { position: 'bottom', labels: { color: textColor, padding: 20, usePointStyle: true } } }
            } 
        }));
    }
}

// Modal & Utilities
window.openModal = id => { document.getElementById(id).classList.remove('hidden'); document.getElementById(id).classList.add('flex'); };
window.closeModal = id => { document.getElementById(id).classList.add('hidden'); document.getElementById(id).classList.remove('flex'); };

window.checkAdminPermission = function(action) {
    const role = localStorage.getItem('userRole');
    if (role === 'Project Manager' || role === 'Viewer') {
        const isDark = document.documentElement.classList.contains('dark');
        Swal.fire({
            icon: 'warning',
            title: 'Akses Ditolak',
            text: `Anda harus meminta izin dari Super Admin untuk ${action}.`,
            background: isDark ? '#1A1A1A' : '#ffffff',
            color: isDark ? '#ffffff' : '#1e293b',
            confirmButtonColor: '#FF7A00'
        });
        return false;
    }
    return true;
};

window.checkViewerPermission = function() {
    if (localStorage.getItem('userRole') === 'Viewer') {
        const isDark = document.documentElement.classList.contains('dark');
        Swal.fire({
            icon: 'error',
            title: 'Akses Ditolak',
            text: 'Role Viewer (Klien) hanya memiliki hak akses baca (Read-Only).',
            background: isDark ? '#1A1A1A' : '#ffffff',
            color: isDark ? '#ffffff' : '#1e293b',
            confirmButtonColor: '#FF7A00'
        });
        return false;
    }
    return true;
};

window.editProyek = function(id) {
    if (!window.checkAdminPermission('mengedit data proyek')) return;
    const p = currentProjects.find(x => String(x.id) === String(id));
    if (!p) return;

    window.currentEditProjectPlans = p.weeklyPlans || {};

    document.getElementById('html-p-code').value = p.code || '';
    document.getElementById('html-p-name').value = p.name || '';
    document.getElementById('html-p-client').value = p.client || '';
    document.getElementById('html-p-loc').value = p.location || '';
    document.getElementById('html-p-val').value = p.value || '';
    document.getElementById('html-p-start').value = p.start || '';
    document.getElementById('html-p-end').value = p.end || '';
    if (document.getElementById('html-p-start') && document.getElementById('html-p-start').value) {
        const event = new Event('change');
        document.getElementById('html-p-start').dispatchEvent(event);
    }
    if(document.getElementById('html-p-img')) document.getElementById('html-p-img').value = p.imageUrl || '';
    if(document.getElementById('html-p-file')) document.getElementById('html-p-file').value = '';

    document.querySelector('#modalProject h3').innerText = 'Edit Proyek';
    const saveBtn = document.querySelector('#modalProject button.bg-blue-600') || document.querySelector('#modalProject button.bg-orange-600');
    saveBtn.innerText = 'Update Proyek';
    saveBtn.setAttribute('onclick', `updateProjectData('${id}')`);

    openModal('modalProject');
};

window.updateProjectData = async function(id) {
    const code = document.getElementById('html-p-code').value;
    const name = document.getElementById('html-p-name').value;
    const client = document.getElementById('html-p-client').value;
    const location = document.getElementById('html-p-loc').value;
    const value = document.getElementById('html-p-val').value;
    const start = document.getElementById('html-p-start').value;
    const end = document.getElementById('html-p-end').value;
    const imageUrl = document.getElementById('html-p-img') ? document.getElementById('html-p-img').value : '';
    const fileInput = document.getElementById('html-p-file');

    if(!code) return Swal.fire('Gagal', 'Kode proyek wajib diisi', 'error');
    if(!name) return Swal.fire('Gagal', 'Nama proyek wajib diisi', 'error');

    const p = currentProjects.find(x => String(x.id) === String(id));
    if(!p) return;
    
    let totalWeeks = p.totalWeeks || 25;
    if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (endDate > startDate) {
            totalWeeks = Math.ceil(Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24)) / 7);
        }
    }
    
    let weeklyPlans = {};
    document.querySelectorAll('.plan-input-week').forEach(inp => {
        const w = inp.getAttribute('data-week');
        const val = parseFloat(inp.value);
        if (!isNaN(val)) weeklyPlans[w] = val;
    });

    let updatedProject = {
        ...p, code, name, client, location, value, start, end, imageUrl, totalWeeks, weeklyPlans
    };
    delete updatedProject.id;

    if (document.getElementById('modalProject')) closeModal('modalProject');
    
    Swal.fire({ title: 'Updating...', text: 'Menyimpan data...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    let finalFile = fileInput && fileInput.files && fileInput.files.length > 0 ? fileInput.files[0] : null;

    if (window.projectCropper) {
        const blob = await new Promise(resolve => {
            window.projectCropper.getCroppedCanvas({ width: 1200, fillColor: '#ffffff' }).toBlob(resolve, 'image/jpeg', 0.85);
        });
        finalFile = new File([blob], "project_cover.jpg", { type: "image/jpeg" });
    }

    if (finalFile) {
        Swal.fire({ title: 'Updating...', text: 'Mengunggah gambar cover baru...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const uploadResult = await uploadImageFile(finalFile, 'projects');
        if (uploadResult && uploadResult.url) {
            updatedProject.imageUrl = uploadResult.url;
            if (uploadResult.id) {
                updatedProject.fileId = uploadResult.id;
                if (p.fileId && p.fileId !== uploadResult.id) deleteImageFile(p.fileId);
            }
        } else {
            return Swal.fire('Gagal Upload', 'Terjadi kesalahan saat mengunggah foto cover.', 'error');
        }
    }

    updateProject(id, updatedProject).then(res => {
        if(res) {
            Swal.fire('Berhasil!', 'Data proyek telah diupdate.', 'success');
            resetProjectForm();
            loadProjectsData();
        } else {
            Swal.fire('Gagal!', 'Terjadi kesalahan server.', 'error');
        }
    });
};

window.resetProjectForm = function() {
    document.getElementById('projectForm').reset();
    window.currentEditProjectPlans = {};
    const durationEl = document.getElementById('html-p-duration');
    if (durationEl) durationEl.innerHTML = '';
    const planContainer = document.getElementById('html-p-plan-container');
    if (planContainer) planContainer.classList.add('hidden');
    document.querySelector('#modalProject h3').innerText = 'Setup Proyek Baru';
    const saveBtn = document.querySelector('#modalProject button[onclick^="updateProjectData"]') || document.querySelector('#modalProject button[onclick="saveProject()"]');
    if (saveBtn) {
        saveBtn.innerText = 'Deploy Proyek';
        saveBtn.setAttribute('onclick', 'saveProject()');
    }
    const pCropperContainer = document.getElementById('project-cropper-container');
    if (pCropperContainer) pCropperContainer.style.display = 'none';
    if (window.projectCropper) {
        window.projectCropper.destroy();
        window.projectCropper = null;
    }
};

window.openAddProjectModal = function() {
    if (!window.checkViewerPermission()) return;
    resetProjectForm();
    openModal('modalProject');
};

window.closeProjectModal = function() {
    closeModal('modalProject');
    resetProjectForm();
};

window.saveProject = async function() {
    if (!window.checkViewerPermission()) return;
    const code = document.getElementById('html-p-code').value;
    const name = document.getElementById('html-p-name').value;
    const client = document.getElementById('html-p-client').value;
    const location = document.getElementById('html-p-loc').value;
    const value = document.getElementById('html-p-val').value;
    const start = document.getElementById('html-p-start').value;
    const end = document.getElementById('html-p-end').value;
    const imageUrl = document.getElementById('html-p-img') ? document.getElementById('html-p-img').value : '';
    const fileInput = document.getElementById('html-p-file');

    if(!code) return Swal.fire('Gagal', 'Kode proyek wajib diisi', 'error');
    if(!name) return Swal.fire('Gagal', 'Nama proyek wajib diisi', 'error');
    
    let totalWeeks = 25;
    if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (endDate > startDate) {
            totalWeeks = Math.ceil(Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24)) / 7);
        }
    }
    
    let weeklyPlans = {};
    document.querySelectorAll('.plan-input-week').forEach(inp => {
        const w = inp.getAttribute('data-week');
        const val = parseFloat(inp.value);
        if (!isNaN(val)) weeklyPlans[w] = val;
    });

    let newProject = {
        code, name, client, location, value, start, end,
        imageUrl: imageUrl,
        status: "Perencanaan",
        progress: 0,
        divSipil: 0, divArs: 0, divMep: 0, totalWeeks: totalWeeks,
        weeklyUpdates: {},
        weeklyPlans: weeklyPlans,
        timestamp: Date.now()
    };

    if (document.getElementById('modalProject')) closeModal('modalProject');
    
    Swal.fire({ title: 'Deploying...', text: 'Mengunggah data & gambar...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    let finalFile = fileInput && fileInput.files && fileInput.files.length > 0 ? fileInput.files[0] : null;

    if (window.projectCropper) {
        const blob = await new Promise(resolve => {
            window.projectCropper.getCroppedCanvas({ width: 1200, fillColor: '#ffffff' }).toBlob(resolve, 'image/jpeg', 0.85);
        });
        finalFile = new File([blob], "project_cover.jpg", { type: "image/jpeg" });
    }

    if (finalFile) {
        const uploadResult = await uploadImageFile(finalFile, 'projects');
        if (uploadResult && uploadResult.url) {
            newProject.imageUrl = uploadResult.url;
            if (uploadResult.id) newProject.fileId = uploadResult.id;
        } else {
            return Swal.fire('Gagal Upload', 'Terjadi kesalahan saat mengunggah foto cover.', 'error');
        }
    }

    addProject(newProject).then(res => {
        if(res) {
            Swal.fire('Berhasil!', 'Sistem proyek telah aktif.', 'success');
            document.getElementById('projectForm').reset();
            loadProjectsData();
        } else {
            Swal.fire('Gagal!', 'Terjadi kesalahan server.', 'error');
        }
    });
};

window.hapusProyek = function(id, fileId) {
    if (!window.checkAdminPermission('menghapus data proyek')) return;
    Swal.fire({
        title: 'Hapus Proyek?',
        text: "Data dan riwayat progress akan dihapus permanen!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#2A2A2A',
        confirmButtonText: 'Ya, Hapus'
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                
            if (fileId) {
                await deleteImageFile(fileId);
            }
                
            deleteProject(id).then(success => {
                if(success) {
                    Swal.fire('Terhapus!', 'Proyek berhasil dihapus.', 'success');
                    loadProjectsData();
                } else {
                    Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus.', 'error');
                }
            });
        }
    });
};

// window.generateReport = function() {
//     Swal.fire({ title: 'Kompilasi Data...', text: 'Menyiapkan dokumen laporan analitik anda', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
//     setTimeout(() => {
//         Swal.fire({ icon: 'success', title: 'Export Berhasil', text: 'Laporan telah diunduh ke perangkat Anda.', confirmButtonColor: '#FF7A00' });
//     }, 2000);
// };

window.viewPhoto = function(url) {
    Swal.fire({ imageUrl: url, imageWidth: '100%', imageAlt: 'Dokumentasi', showConfirmButton: false, backdrop: 'rgba(0,0,0,0.85)' });
};

// ==========================================
// INTEGRASI MANAJEMEN TESTIMONI & KLIEN
// ==========================================

let currentTestimonials = [];
async function loadTestimonialsData() {
    try {
        const container = document.getElementById('testimonialsGrid');
        if (!container) return; 
        
        container.innerHTML = '<div class="col-span-full text-center py-10"><i class="fas fa-spinner fa-spin text-3xl text-orange-500"></i><p class="mt-3 text-slate-500">Memuat data testimoni...</p></div>';
        
        currentTestimonials = await getTestimonials();
        renderTestimonials();
    } catch (error) {
        console.error("Error loading testimonials:", error);
    }
}

function renderTestimonials() {
    const container = document.getElementById('testimonialsGrid');
    if (!container) return;
    
    if (currentTestimonials.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-slate-500 py-10">Belum ada testimoni.</div>';
        return;
    }
    
    const isViewer = localStorage.getItem('userRole') === 'Viewer';

    container.innerHTML = currentTestimonials.map(t => `
        <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-100 dark:border-slate-700 relative group transition-all">
            ${!isViewer ? `<button onclick="hapusTestimoni('${t.id}')" class="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 dark:bg-red-900/30 w-8 h-8 rounded-full flex items-center justify-center"><i class="fas fa-trash"></i></button>` : ''}
            <div class="flex items-center mb-4">
                <img src="${t.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name || 'User')}&background=random`}" class="w-12 h-12 rounded-full mr-4 object-cover">
                <div>
                    <h4 class="font-bold text-slate-800 dark:text-white">${t.name}</h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400">${t.position || '-'}</p>
                </div>
            </div>
            <p class="text-sm text-slate-600 dark:text-slate-300">"${t.message}"</p>
        </div>
    `).join('');
}

window.tambahTestimoni = function() {
    if (!window.checkViewerPermission()) return;
    Swal.fire({
        title: 'Tambah Testimoni',
        html: `
            <input id="swal-t-name" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white" placeholder="Nama Klien / Tokoh">
            <input id="swal-t-pos" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white" placeholder="Jabatan / Perusahaan">
            <input id="swal-t-img" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white" placeholder="URL Foto (Opsional)">
            <textarea id="swal-t-msg" class="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white resize-none" rows="3" placeholder="Pesan Testimoni"></textarea>
        `,
        showCancelButton: true,
        confirmButtonColor: '#FF7A00',
        confirmButtonText: 'Simpan',
        cancelButtonText: 'Batal',
        preConfirm: () => {
            const name = document.getElementById('swal-t-name').value;
            const position = document.getElementById('swal-t-pos').value;
            const imageUrl = document.getElementById('swal-t-img').value;
            const message = document.getElementById('swal-t-msg').value;
            if (!name || !message) {
                Swal.showValidationMessage('Nama dan Pesan wajib diisi!');
            }
            return { name, position, imageUrl, message, rating: 5 };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            addTestimonial(result.value).then(res => {
                if(res) {
                    Swal.fire('Berhasil!', 'Testimoni ditambahkan.', 'success');
                    loadTestimonialsData();
                } else {
                    Swal.fire('Gagal!', 'Terjadi kesalahan server.', 'error');
                }
            });
        }
    });
};

// ==========================================
// INTEGRASI MANAJEMEN BERITA & PORTOFOLIO
// ==========================================

let currentNews = [];
async function loadNewsData() {
    try {
        const container = document.getElementById('newsGrid');
        if (!container) return;
        container.innerHTML = '<div class="col-span-full text-center py-10"><i class="fas fa-spinner fa-spin text-3xl text-orange-500"></i></div>';
        currentNews = await getNews();
        renderNews();
    } catch (error) { console.error(error); }
}

function renderNews() {
    const container = document.getElementById('newsGrid');
    if (!container) return;
    if (currentNews.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-slate-500 py-10">Belum ada artikel berita diterbitkan.</div>';
        return;
    }
    const isViewer = localStorage.getItem('userRole') === 'Viewer';

    container.innerHTML = currentNews.map(n => `
        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow border border-slate-100 dark:border-slate-700 relative group">
            ${!isViewer ? `<button onclick="hapusBerita('${n.id}', '${n.fileId || ''}')" class="absolute top-2 right-2 text-white bg-red-500 hover:bg-red-600 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md"><i class="fas fa-trash text-xs"></i></button>` : ''}
            <img src="${n.imageUrl || 'https://placehold.co/400x200?text=News'}" class="w-full h-32 object-cover rounded-lg mb-3">
            <span class="text-xs font-bold text-orange-500 mb-1 block">${n.category || 'Berita'}</span>
            <h4 class="font-bold text-slate-800 dark:text-white line-clamp-2">${n.title}</h4>
        </div>
    `).join('');
}

window.tambahBerita = function() {
    if (!window.checkViewerPermission()) return;
    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
        title: 'Tulis Artikel/Berita',
        width: '600px',
        background: isDark ? '#1A1A1A' : '#ffffff',
        color: isDark ? '#ffffff' : '#1e293b',
        html: `
            <input id="swal-n-title" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white" placeholder="Judul Berita">
            <input id="swal-n-cat" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white" placeholder="Kategori (Misal: Artikel / Pencapaian)">
            <div class="mb-3 text-left">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">Upload Cover Berita</label>
                <input type="file" id="swal-n-file" accept="image/*" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2 outline-none text-slate-800 dark:text-white file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 dark:file:bg-[#FF7A00]/20 dark:file:text-[#FF7A00] cursor-pointer">
            </div>
            <div class="text-center text-slate-400 dark:text-slate-500 text-sm my-2 mb-3">— ATAU —</div>
            <input id="swal-n-img" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white" placeholder="URL Gambar Cover">
            <textarea id="swal-n-content" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-3 outline-none text-slate-800 dark:text-white h-40 resize-none" placeholder="Isi Artikel (Mendukung paragraf baris baru)"></textarea>
        `,
        showCancelButton: true,
        confirmButtonColor: '#FF7A00',
        cancelButtonColor: isDark ? '#2A2A2A' : '#64748B',
        confirmButtonText: 'Publish',
        preConfirm: () => {
            const fileInput = document.getElementById('swal-n-file');
            return {
                title: document.getElementById('swal-n-title').value,
                category: document.getElementById('swal-n-cat').value,
                imageUrl: document.getElementById('swal-n-img').value,
                content: document.getElementById('swal-n-content').value,
                file: fileInput.files && fileInput.files.length > 0 ? fileInput.files[0] : null,
                date: new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})
            }
        }
    }).then(async (result) => {
        if (result.isConfirmed && result.value.title) {
            Swal.fire({ title: 'Publishing...', text: 'Mengunggah konten...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
            let dataToSave = { ...result.value };
            
            if (dataToSave.file) {
                const uploadResult = await uploadImageFile(dataToSave.file, 'news');
                if (uploadResult && uploadResult.url) {
                    dataToSave.imageUrl = uploadResult.url;
                    if (uploadResult.id) dataToSave.fileId = uploadResult.id;
                }
            }
            delete dataToSave.file;
            
            addNews(dataToSave).then(res => {
                if(res) { Swal.fire('Berhasil!', 'Berita diterbitkan.', 'success'); loadNewsData(); } 
                else Swal.fire('Gagal!', 'Terjadi kesalahan.', 'error');
            });
        }
    });
};

window.hapusBerita = function(id, fileId) {
    if (!window.checkAdminPermission('menghapus artikel/berita')) return;
    Swal.fire({ title: 'Hapus Berita?', text: 'Gambar terkait di Drive juga akan ikut terhapus.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#EF4444', confirmButtonText: 'Hapus' })
    .then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            if (fileId) {
                await deleteImageFile(fileId);
            }
            deleteNews(id).then(success => {
                if(success) { Swal.fire('Terhapus!', 'Berita dihapus.', 'success'); loadNewsData(); }
            });
        }
    });
};

let currentGallery = [];
async function loadGalleryData() {
    try {
        const container = document.getElementById('galleryGrid');
        if (container) container.innerHTML = '<div class="col-span-full text-center py-10"><i class="fas fa-spinner fa-spin text-3xl text-orange-500"></i></div>';
        currentGallery = await getGallery();
        if (container) renderGallery();
        if (typeof window.updateActivityFeed === 'function') window.updateActivityFeed();
        
        // Jika sedang membuka detail proyek, render ulang agar foto yang baru diunggah muncul otomatis
        const detailView = document.getElementById('view-project-detail');
        if (detailView && !detailView.classList.contains('hidden') && window.currentProjectId) {
            viewDetail(window.currentProjectId);
        }
    } catch (error) { console.error(error); }
}

function renderGallery() {
    const container = document.getElementById('galleryGrid');
    if (!container) return;
    if (currentGallery.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-slate-500 py-10">Belum ada foto portofolio lapangan.</div>';
        return;
    }
    const isViewer = localStorage.getItem('userRole') === 'Viewer';

    container.innerHTML = currentGallery.map(g => `
        <div class="relative group rounded-2xl overflow-hidden shadow-sm cursor-pointer w-full aspect-video" onclick="viewPhoto('${g.imageUrl}')">
            <img src="${g.imageUrl}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <p class="text-white font-bold text-base line-clamp-1">${g.title}</p>
                <p class="text-orange-400 text-xs mt-1 font-medium"><i class="fas fa-building mr-1"></i> ${g.project || 'Proyek Umum'}</p>
                
                ${!isViewer ? `
                <div class="absolute top-4 right-4 flex gap-2">
                    <button onclick="event.stopPropagation(); hapusPortofolio('${g.id}', '${g.fileId || ''}')" class="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-lg" title="Hapus Foto">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>` : ''}
            </div>
        </div>
    `).join('');
}

window.tambahPortofolio = function(projectId = '') {
    if (!window.checkViewerPermission()) return;
    const defaultProjId = typeof projectId === 'string' ? projectId : '';
    const isDark = document.documentElement.classList.contains('dark');
    
    const projectOptions = currentProjects.map(p => 
        `<option value="${p.id}" ${String(p.id) === String(defaultProjId) ? 'selected' : ''}>${p.name}</option>`
    ).join('');

    Swal.fire({
        title: 'Upload Portofolio',
        background: isDark ? '#1A1A1A' : '#ffffff',
        color: isDark ? '#ffffff' : '#1e293b',
        html: `
            <input id="swal-g-title" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white" placeholder="Judul Foto">
            <select id="swal-g-proj" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white cursor-pointer">
                <option value="">-- Pilih Proyek Terkait (Opsional) --</option>
                ${projectOptions}
            </select>
            
            <div class="mb-3 text-left">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">Upload File (Kamera / Galeri)</label>
                <input type="file" id="swal-g-file" accept="image/*" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2 outline-none text-slate-800 dark:text-white file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 dark:file:bg-[#FF7A00]/20 dark:file:text-[#FF7A00] cursor-pointer">
            </div>
            
            <div id="portofolio-cropper-container" style="display: none; margin-bottom: 1rem;">
                <div style="width: 100%; max-height: 300px; overflow: hidden; border-radius: 0.5rem; border: 1px solid #2A2A2A;">
                    <img id="portofolio-cropper-image" style="max-width: 100%; display: block;">
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">Geser dan perbesar/perkecil gambar untuk menyesuaikan foto.</p>
            </div>

            <div class="text-center text-slate-400 dark:text-slate-500 text-sm my-2 mb-3">— ATAU —</div>
            
            <input id="swal-g-img" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white" placeholder="URL Gambar Online (Opsional)">
        `,
        showCancelButton: true,
        confirmButtonColor: '#FF7A00',
        cancelButtonColor: isDark ? '#2A2A2A' : '#64748B',
        confirmButtonText: 'Upload',
        cancelButtonText: 'Batal',
        didOpen: () => {
            const fileInput = document.getElementById('swal-g-file');
            const cropperContainer = document.getElementById('portofolio-cropper-container');
            const cropperImage = document.getElementById('portofolio-cropper-image');
            
            window.portfolioCropper = null;
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        cropperContainer.style.display = 'block';
                        
                        cropperImage.onload = () => {
                            if (window.portfolioCropper) window.portfolioCropper.destroy();
                            
                            window.portfolioCropper = new Cropper(cropperImage, {
                                viewMode: 1,
                                dragMode: 'move',
                                autoCropArea: 1,
                                cropBoxResizable: true,
                                cropBoxMovable: true,
                                guides: true,
                                center: true,
                                background: true
                            });
                        };
                        cropperImage.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                } else {
                    cropperContainer.style.display = 'none';
                    if (window.portfolioCropper) { window.portfolioCropper.destroy(); window.portfolioCropper = null; }
                }
            });
        },
        preConfirm: () => {
            const title = document.getElementById('swal-g-title').value;
            const projId = document.getElementById('swal-g-proj').value;
            const imageUrl = document.getElementById('swal-g-img').value;
            const fileInput = document.getElementById('swal-g-file');
            
            if (!title) {
                Swal.showValidationMessage('Judul foto wajib diisi!');
                return false;
            }
            if (!imageUrl && (!fileInput.files || fileInput.files.length === 0)) {
                Swal.showValidationMessage('Silakan pilih file foto atau masukkan URL!');
                return false;
            }
            
            const selectedProj = currentProjects.find(p => String(p.id) === String(projId));

            if (window.portfolioCropper) {
                return new Promise((resolve) => {
                    window.portfolioCropper.getCroppedCanvas({
                        width: 1200,
                        fillColor: '#ffffff'
                    }).toBlob((blob) => {
                        const croppedFile = new File([blob], "portfolio_img.jpg", { type: "image/jpeg" });
                        resolve({
                            title: title,
                            projectId: projId,
                            project: selectedProj ? selectedProj.name : '',
                            imageUrl: '',
                            file: croppedFile,
                            date: new Date().getFullYear().toString(),
                            timestamp: Date.now()
                        });
                    }, 'image/jpeg', 0.85);
                });
            } else {
                return {
                    title: title,
                    projectId: projId,
                    project: selectedProj ? selectedProj.name : '',
                    imageUrl: imageUrl,
                    file: fileInput.files && fileInput.files.length > 0 ? fileInput.files[0] : null,
                    date: new Date().getFullYear().toString(),
                    timestamp: Date.now()
                }
            }
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ 
                title: 'Mengunggah...', 
                text: 'Harap tunggu, sedang memproses file',
                background: isDark ? '#1A1A1A' : '#ffffff',
                color: isDark ? '#ffffff' : '#1e293b',
                allowOutsideClick: false, 
                didOpen: () => Swal.showLoading() 
            });
            
            let dataToSave = { ...result.value };
            
            if (dataToSave.file) {
                const uploadResult = await uploadImageFile(dataToSave.file, 'gallery');
                if (uploadResult && uploadResult.url) {
                    dataToSave.imageUrl = uploadResult.url;
                    if (uploadResult.id) dataToSave.fileId = uploadResult.id;
                } else {
                    Swal.fire({ icon: 'error', title: 'Gagal Upload', text: 'Terjadi kesalahan saat mengunggah foto.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' });
                    return;
                }
            }
            delete dataToSave.file; // Hapus objek File karena Firebase Database tidak bisa menyimpan File secara langsung
            
            addGallery(dataToSave).then(res => {
                if(res) { 
                    Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Foto portofolio ditambahkan.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b', confirmButtonColor: '#FF7A00' }); 
                    loadGalleryData(); 
                } else { 
                    Swal.fire({ icon: 'error', title: 'Gagal!', text: 'Terjadi kesalahan server.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' }); 
                }
            });
        }
    });
};

window.hapusPortofolio = function(id, fileId) {
    if (!window.checkAdminPermission('menghapus foto portofolio')) return;
    Swal.fire({ title: 'Hapus Portofolio?', text: 'Foto juga akan dihapus secara permanen dari Google Drive.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#EF4444', confirmButtonText: 'Hapus' })
    .then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
            // Hapus file fisik dari Google Drive jika fileId tersimpan
            if (fileId) {
                await deleteImageFile(fileId);
            }
            
            deleteGallery(id).then(success => {
                if(success) { Swal.fire('Terhapus!', 'Foto berhasil dihapus.', 'success'); loadGalleryData(); }
            });
        }
    });
};

window.hapusTestimoni = function(id) {
    if (!window.checkAdminPermission('menghapus testimoni klien')) return;
    Swal.fire({
        title: 'Hapus Testimoni?',
        text: "Data ini tidak dapat dikembalikan!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'Ya, Hapus'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            deleteTestimonial(id).then(success => {
                if(success) {
                    Swal.fire('Terhapus!', 'Testimoni berhasil dihapus.', 'success');
                    loadTestimonialsData();
                } else {
                    Swal.fire('Gagal!', 'Terjadi kesalahan.', 'error');
                }
            });
        }
    });
};

let currentClients = [];
async function loadClientsData() {
    try {
        const container = document.getElementById('clientsGrid');
        if (!container) return;
        
        container.innerHTML = '<div class="col-span-full text-center py-10"><i class="fas fa-spinner fa-spin text-3xl text-orange-500"></i><p class="mt-3 text-slate-500">Memuat data klien...</p></div>';
        
        currentClients = await getClients();
        renderClients();
    } catch (error) {
        console.error("Error loading clients:", error);
    }
}

function renderClients() {
    const container = document.getElementById('clientsGrid');
    if (!container) return;
    
    if (currentClients.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-slate-500 py-10">Belum ada klien.</div>';
        return;
    }
    
    container.innerHTML = currentClients.map(c => `
        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center relative group">
            <button onclick="hapusKlien('${c.id}', '${c.fileId || ''}')" class="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 dark:bg-red-900/30 w-8 h-8 rounded-full flex items-center justify-center"><i class="fas fa-trash text-xs"></i></button>
            <img src="${c.logoUrl}" alt="${c.name}" class="h-16 w-16 object-cover rounded-full shadow-sm mb-3 filter grayscale hover:grayscale-0 transition-all">
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center">${c.name}</span>
        </div>
    `).join('');
}

window.tambahKlien = function() {
    if (!window.checkViewerPermission()) return;
    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
        title: 'Tambah Klien',
        background: isDark ? '#1A1A1A' : '#ffffff',
        color: isDark ? '#ffffff' : '#1e293b',
        html: `
            <input id="swal-c-name" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white" placeholder="Nama Perusahaan / Klien">
            <div class="mb-3 text-left">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">Upload Logo Klien</label>
                <input type="file" id="swal-c-file" accept="image/*" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2 outline-none text-slate-800 dark:text-white file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 dark:file:bg-[#FF7A00]/20 dark:file:text-[#FF7A00] cursor-pointer">
            </div>
            
            <div id="cropper-container" class="cropper-circle-mode" style="display: none; margin-bottom: 1rem;">
                <div style="width: 100%; max-height: 300px; overflow: hidden; border-radius: 0.5rem; border: 1px solid #2A2A2A;">
                    <img id="cropper-image" style="max-width: 100%; display: block;">
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">Geser dan perbesar/perkecil gambar untuk menyesuaikan logo.</p>
            </div>

            <div class="text-center text-slate-400 dark:text-slate-500 text-sm my-2 mb-3">— ATAU —</div>
            <input id="swal-c-logo" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white" placeholder="URL Logo Klien (Opsional)">
        `,
        showCancelButton: true,
        confirmButtonColor: '#FF7A00',
        cancelButtonColor: isDark ? '#2A2A2A' : '#64748B',
        confirmButtonText: 'Simpan',
        cancelButtonText: 'Batal',
        didOpen: () => {
            const fileInput = document.getElementById('swal-c-file');
            const cropperContainer = document.getElementById('cropper-container');
            const cropperImage = document.getElementById('cropper-image');
            
            window.clientCropper = null;
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        cropperContainer.style.display = 'block';
                        
                        cropperImage.onload = () => {
                            if (window.clientCropper) {
                                window.clientCropper.destroy();
                            }
                            
                            window.clientCropper = new Cropper(cropperImage, {
                                aspectRatio: 1,
                                viewMode: 1,
                                dragMode: 'move',
                                autoCropArea: 1,
                                cropBoxResizable: true,
                                cropBoxMovable: true,
                                guides: false,
                                center: false,
                                highlight: false,
                                background: false
                            });
                        };
                        cropperImage.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                } else {
                    cropperContainer.style.display = 'none';
                    if (window.clientCropper) {
                        window.clientCropper.destroy();
                        window.clientCropper = null;
                    }
                }
            });
        },
        preConfirm: () => {
            const name = document.getElementById('swal-c-name').value;
            const logoUrl = document.getElementById('swal-c-logo').value;
            const fileInput = document.getElementById('swal-c-file');
            if (!name) {
                Swal.showValidationMessage('Nama Klien wajib diisi!');
                return false;
            }
            
            if (window.clientCropper) {
                return new Promise((resolve) => {
                    window.clientCropper.getCroppedCanvas({
                        width: 400,
                        height: 400,
                        fillColor: '#ffffff'
                    }).toBlob((blob) => {
                        const croppedFile = new File([blob], "client_logo.jpg", { type: "image/jpeg" });
                        resolve({ name, logoUrl: '', file: croppedFile });
                    }, 'image/jpeg', 0.9);
                });
            } else {
                if (!logoUrl && (!fileInput.files || fileInput.files.length === 0)) {
                    Swal.showValidationMessage('Silakan pilih file logo atau masukkan URL!');
                    return false;
                }
                return { name, logoUrl, file: fileInput.files && fileInput.files.length > 0 ? fileInput.files[0] : null };
            }
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
            let dataToSave = { ...result.value };
            
            if (dataToSave.file) {
                const uploadResult = await uploadImageFile(dataToSave.file, 'clients');
                if (uploadResult && uploadResult.url) {
                    dataToSave.logoUrl = uploadResult.url;
                    if (uploadResult.id) dataToSave.fileId = uploadResult.id;
                }
            }
            delete dataToSave.file;

            addClient(dataToSave).then(res => {
                if(res) {
                    Swal.fire('Berhasil!', 'Klien ditambahkan.', 'success');
                    loadClientsData();
                } else {
                    Swal.fire('Gagal!', 'Terjadi kesalahan server.', 'error');
                }
            });
        }
    });
};

window.hapusKlien = function(id, fileId) {
    if (!window.checkAdminPermission('menghapus data klien')) return;
    Swal.fire({
        title: 'Hapus Klien?',
        text: "Data logo klien akan dihapus!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'Ya, Hapus'
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            if (fileId) {
                await deleteImageFile(fileId);
            }
            deleteClient(id).then(success => {
                if(success) {
                    Swal.fire('Terhapus!', 'Klien berhasil dihapus.', 'success');
                    loadClientsData();
                } else {
                    Swal.fire('Gagal!', 'Terjadi kesalahan.', 'error');
                }
            });
        }
    });
};