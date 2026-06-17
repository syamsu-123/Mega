import { getSuppliers } from './src/js/firebase-service.js';

let allSuppliers = [];
let currentSearchQuery = '';

// --- Theme Toggle Logic (for consistency) ---
function initThemeToggle() {
    const themeToggleBtn = document.getElementById('themeToggle');
    if (!themeToggleBtn) return;

    const updateTheme = () => {
        if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            themeToggleBtn.innerHTML = '<i class="fas fa-sun text-lg"></i>';
        } else {
            document.documentElement.classList.remove('dark');
            themeToggleBtn.innerHTML = '<i class="fas fa-moon text-lg"></i>';
        }
    };

    themeToggleBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateTheme();
    });

    updateTheme();
}

// --- Main Logic ---
document.addEventListener('DOMContentLoaded', async () => {
    initThemeToggle();

    const loadingIndicator = document.getElementById('loading-indicator');
    const mainContent = document.getElementById('main-content');

    try {
        allSuppliers = await getSuppliers();
        renderComparison();
    } catch (error) {
        console.error("Gagal memuat data supplier:", error);
        document.getElementById('comparison-results').innerHTML = `<div class="p-8 text-center text-red-500 dark:text-red-400 italic bg-red-50 dark:bg-red-500/10 rounded-xl">Gagal memuat data. Silakan coba lagi.</div>`;
    } finally {
        loadingIndicator.classList.add('hidden');
        mainContent.classList.remove('hidden');
    }
});

window.filterData = (query) => {
    currentSearchQuery = query.trim().toLowerCase();
    renderComparison();
};

function renderComparison() {
    const resultsContainer = document.getElementById('comparison-results');
    if (!resultsContainer) return;

    // 1. Group suppliers by material
    const materialsMap = new Map();
    allSuppliers.forEach(supplier => {
        if (supplier.material && supplier.price > 0) {
            const materialKey = supplier.material.trim().toLowerCase();
            if (!materialsMap.has(materialKey)) {
                materialsMap.set(materialKey, { name: supplier.material.trim(), suppliers: [] });
            }
            materialsMap.get(materialKey).suppliers.push(supplier);
        }
    });

    // 2. Sort suppliers within each material group by price
    materialsMap.forEach(material => material.suppliers.sort((a, b) => a.price - b.price));

    // 3. Filter materials based on search query
    let filteredMaterials = Array.from(materialsMap.values());
    if (currentSearchQuery) {
        filteredMaterials = filteredMaterials.filter(material => 
            material.name.toLowerCase().includes(currentSearchQuery) || 
            material.suppliers.some(s => s.name.toLowerCase().includes(currentSearchQuery))
        );
    }

    // 4. Render HTML
    if (filteredMaterials.length === 0) {
        resultsContainer.innerHTML = `<div class="p-8 text-center text-slate-500 dark:text-[#A1A1AA] italic bg-white/80 dark:bg-[#1A1A1A]/80 rounded-xl border border-slate-200 dark:border-[#2A2A2A]">Tidak ada data yang cocok dengan pencarian Anda.</div>`;
        return;
    }

    resultsContainer.innerHTML = filteredMaterials.map(material => `
        <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-[#2A2A2A] shadow-sm overflow-hidden">
            <div class="p-4 sm:p-6 border-b border-slate-200 dark:border-[#2A2A2A] bg-slate-50/50 dark:bg-[#121212]/50">
                <h2 class="text-xl font-bold text-slate-800 dark:text-white">${material.name}</h2>
                <p class="text-sm text-slate-500 dark:text-[#A1A1AA]">Ditemukan dari ${material.suppliers.length} supplier.</p>
            </div>
            <div class="divide-y divide-slate-200 dark:divide-[#2A2A2A]">
                ${material.suppliers.map((supplier, index) => {
                    const isBestPrice = index === 0;
                    const priceFmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(supplier.price);
                    const dateFmt = supplier.timestamp ? new Date(supplier.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                    return `
                        <div class="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isBestPrice ? 'bg-green-50/50 dark:bg-green-500/5' : 'hover:bg-slate-50/50 dark:hover:bg-white/5'} transition-colors">
                            <div class="flex-1 min-w-0">
                                <p class="font-semibold text-slate-800 dark:text-white truncate">${supplier.name}</p>
                                <div class="flex items-center gap-x-4 gap-y-1 flex-wrap mt-1">
                                    <p class="text-xs text-slate-500 dark:text-[#A1A1AA]"><i class="fas fa-phone-alt fa-fw mr-1.5 text-slate-400"></i>${supplier.contact || '-'}</p>
                                    <p class="text-xs text-slate-500 dark:text-[#A1A1AA]"><i class="fas fa-calendar-alt fa-fw mr-1.5 text-slate-400"></i>Update: ${dateFmt}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-4 w-full sm:w-auto">
                                <div class="text-right flex-1 sm:flex-none"><p class="text-lg font-bold ${isBestPrice ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}">${priceFmt}</p><p class="text-xs text-slate-500 dark:text-[#A1A1AA]">per ${supplier.unit || 'satuan'}</p></div>
                                ${isBestPrice ? `<div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20"><i class="fas fa-star text-yellow-400"></i><span class="text-xs font-bold text-green-700 dark:text-green-300">Harga Terbaik</span></div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');
}