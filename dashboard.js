import { getProjects } from './src/js/firebase-service.js';
import { auth } from './src/js/firebase-config.js';
import { signOut } from 'firebase/auth';

document.addEventListener('DOMContentLoaded', async () => {
    // Basic Setup: User Name, Theme, Logout
    const userName = localStorage.getItem('userName') || 'Pengguna';
    const userRole = localStorage.getItem('userRole') || 'Viewer';
    document.getElementById('user-name').textContent = userName;

    const themeToggleBtn = document.getElementById('themeToggle');
    if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun text-lg"></i>';
    } else {
        themeToggleBtn.innerHTML = '<i class="fas fa-moon text-lg"></i>';
    }

    themeToggleBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggleBtn.innerHTML = isDark ? '<i class="fas fa-sun text-lg"></i>' : '<i class="fas fa-moon text-lg"></i>';
    });

    document.getElementById('logout-button').addEventListener('click', async () => {
        await signOut(auth);
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // --- Menu Rendering Logic ---
    const menuContainer = document.getElementById('dashboard-menu');

    const allMenuItems = [
        {
            title: 'Monitoring Material',
            description: 'Lacak progres dan status semua material proyek.',
            icon: 'fa-boxes',
            href: 'monitoring-material.html', // akan di-set setelah proyek valid tersedia
            roles: ['Project Manager', 'Viewer'],
            id: 'monitoring-material-card'
        },
        {
            title: 'Monitoring Supplier',
            description: 'Kelola data supplier dan harga material.',
            icon: 'fa-truck',
            href: 'monitoring-supplier.html',
            roles: ['Super Admin', 'Project Manager']
        },
        {
            title: 'Perbandingan Harga',
            description: 'Bandingkan harga material dari semua supplier.',
            icon: 'fa-balance-scale-right',
            href: 'perbandingan-harga.html',
            roles: ['Super Admin', 'Project Manager']
        },
        {
            title: 'Manajemen Proyek',
            description: 'Tambah atau edit data proyek yang berjalan.',
            icon: 'fa-tasks',
            href: '#', // Placeholder for future page
            roles: ['Super Admin']
        },
        {
            title: 'Manajemen Tim',
            description: 'Kelola akun dan hak akses pengguna.',
            icon: 'fa-users-cog',
            href: '#', // Placeholder for future page
            roles: ['Super Admin']
        }
    ];

    const accessibleItems = allMenuItems.filter(item => item.roles.includes(userRole));

    if (accessibleItems.length > 0) {
        menuContainer.innerHTML = accessibleItems.map(item => `
            <a href="${item.href}" id="${item.id || ''}" class="block bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-[#FF7A00] dark:hover:border-[#FF7A00] transition-all duration-300 group">
                <div class="flex justify-between items-start">
                    <div class="w-12 h-12 rounded-full bg-orange-50 dark:bg-[#FF7A00]/10 flex items-center justify-center text-[#FF7A00] text-xl mb-4">
                        <i class="fas ${item.icon}"></i>
                    </div>
                    <i class="fas fa-arrow-right text-slate-300 dark:text-slate-600 group-hover:text-[#FF7A00] transition-colors"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-800 dark:text-white mb-1 group-hover:text-[#FF7A00] transition-colors">${item.title}</h3>
                <p class="text-sm text-slate-500 dark:text-[#A1A1AA]">${item.description}</p>
            </a>
        `).join('');
    } else {
        menuContainer.innerHTML = `<div class="col-span-full p-8 text-center bg-white/80 dark:bg-[#1A1A1A]/80 rounded-xl border border-slate-200 dark:border-[#2A2A2A]"><p class="text-slate-500 dark:text-[#A1A1AA]">Tidak ada menu yang tersedia untuk peran Anda.</p></div>`;
    }

    // --- Project Selection Logic (for PM/Viewer) ---
    const getValidSelectedProjectId = (projects) => {
        const stored = localStorage.getItem('selectedProjectId');
        if (stored && projects.some(p => String(p.id) === String(stored))) return stored;
        return projects?.[0]?.id || null;
    };

    if (userRole === 'Project Manager' || userRole === 'Viewer') {
        const projectContainer = document.getElementById('project-selection-container');
        const projectSelector = document.getElementById('project-selector');
        projectContainer.classList.remove('hidden');

        let projects = await getProjects();

        // Ambil proyek valid untuk dijadikan default/selectedProjectId
        let selectedProjectId = getValidSelectedProjectId(projects);
        if (!selectedProjectId && projects.length > 0) {
            selectedProjectId = projects[0].id;
        }

        // Jika tidak ada proyek, disable kartu yang butuh project
        if (!projects || projects.length === 0) {
            const hseCard = document.getElementById('hse-kpi-card');
            if (hseCard) {
                hseCard.removeAttribute('href');
                hseCard.classList.add('opacity-50', 'pointer-events-none');
            }

            const materialCard = document.getElementById('monitoring-material-card');
            if (materialCard) {
                materialCard.removeAttribute('href');
                materialCard.classList.add('opacity-50', 'pointer-events-none');
            }

            projectContainer.innerHTML = `<p class="text-slate-500 dark:text-[#A1A1AA]">Tidak ada proyek yang terdaftar.</p>`;
            return;
        }

        // Render selector
        projectSelector.innerHTML = projects.map(p => `<option value="${p.id}" ${String(p.id) === String(selectedProjectId) ? 'selected' : ''}>${p.name}</option>`).join('');
        localStorage.setItem('selectedProjectId', selectedProjectId);

        // Update link kartu monitoring material
        const materialCard = document.getElementById('monitoring-material-card');
        if (materialCard) {
            materialCard.href = `monitoring-material.html?projectId=${selectedProjectId}`;
        }

        projectSelector.addEventListener('change', (e) => {
            const newProjectId = e.target.value;
            if (!newProjectId) return;

            // Pastikan id masih ada di daftar proyek yang ada
            const isValid = projects.some(p => String(p.id) === String(newProjectId));
            if (!isValid) {
                if (window.Swal) {
                    Swal.fire('Proyek tidak valid', 'Silakan pilih proyek dari daftar yang tersedia.', 'warning');
                } else {
                    console.warn('Proyek tidak valid:', newProjectId);
                }
                return;
            }

            localStorage.setItem('selectedProjectId', newProjectId);
            if (materialCard) {
                materialCard.href = `monitoring-material.html?projectId=${newProjectId}`;
            }
        });
    }
});
