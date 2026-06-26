import { getSuppliers } from './src/js/firebase-service.js';

let comparisonItems = [
    { id: Date.now(), barang: '', qty: 1, satuan: '', hargaRap: 0, hargaA: 0, hargaB: 0, hargaC: 0, ket: '' }
];
let suppliersList = [];
let uniqueVendors = [];
let uniqueMaterials = [];
let selectedVendors = { A: '', B: '', C: '' };

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
    const loadingIndicator = document.getElementById('loading-indicator');
    const mainContent = document.getElementById('main-content');

    try {
        suppliersList = await getSuppliers();
        const vendorSet = new Set();
        const materialSet = new Set();
        suppliersList.forEach(s => {
            const vName = s.name || s.supplierName || s.nama || s.vendor;
            if (vName) vendorSet.add(String(vName).trim());
            const mName = s.material || s.namaMaterial || s.barang;
            if (mName) materialSet.add(String(mName).trim());
        });
        uniqueVendors = Array.from(vendorSet).sort();
        uniqueMaterials = Array.from(materialSet).sort();

        // Cek apakah ada data yang tersimpan sebelumnya
        const savedData = localStorage.getItem('megatama_comparison_data');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            comparisonItems = parsed.items || comparisonItems;
            selectedVendors = parsed.vendors || selectedVendors;
        }

        renderComparisonLayout();
    } catch (error) {
        console.error("Gagal memuat data supplier:", error);
    } finally {
        if(loadingIndicator) loadingIndicator.classList.add('hidden');
        if(mainContent) mainContent.classList.remove('hidden');
    }
});

const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num || 0);

window.formatInput = function(input) {
    let val = input.value.replace(/\D/g, '');
    if (val === '') val = '0';
    input.value = parseInt(val).toLocaleString('id-ID');
}

window.updateItem = function(id, field, value) {
    const item = comparisonItems.find(i => i.id === id);
    if (item) {
        if (field.startsWith('harga') || field === 'qty') {
            item[field] = parseInt(value.replace(/\D/g, '')) || 0;
        } else {
            item[field] = value;
            if (field === 'barang') {
                autoFillPrices(item);
            }
        }
        renderComparisonTable();
    }
}

window.addItem = function() {
    comparisonItems.push({ id: Date.now(), barang: '', qty: 1, satuan: '', hargaRap: 0, hargaA: 0, hargaB: 0, hargaC: 0, ket: '' });
    renderComparisonTable();
}

window.removeItem = function(id) {
    Swal.fire({
        title: 'Hapus Item?',
        text: "Apakah Anda yakin ingin menghapus item ini dari tabel perbandingan?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', // red-500
        cancelButtonColor: '#94a3b8', // slate-400
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            comparisonItems = comparisonItems.filter(i => i.id !== id);
            renderComparisonTable();
            Swal.fire({
                icon: 'success',
                title: 'Terhapus!',
                text: 'Item berhasil dihapus dari tabel.',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
}

window.saveComparison = function() {
    Swal.fire({
        title: 'Simpan Perubahan?',
        text: "Data tabel perbandingan harga Anda akan disimpan.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5', // indigo-600
        cancelButtonColor: '#94a3b8', // slate-400
        confirmButtonText: 'Ya, Simpan',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            try {
                const dataToSave = {
                    items: comparisonItems,
                    vendors: selectedVendors
                };
                localStorage.setItem('megatama_comparison_data', JSON.stringify(dataToSave));
                
                Swal.fire({
                    icon: 'success',
                    title: 'Tersimpan!',
                    text: 'Data perbandingan harga berhasil disimpan.',
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error("Gagal menyimpan data:", error);
                Swal.fire('Error', 'Gagal menyimpan data.', 'error');
            }
        }
    });
}

window.clearAllTable = function() {
    Swal.fire({
        title: 'Bersihkan Semua Data?',
        text: "Seluruh item dan data vendor di tabel ini akan dihapus secara permanen. Lanjutkan?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', // red-500
        cancelButtonColor: '#94a3b8', // slate-400
        confirmButtonText: 'Ya, Bersihkan',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            comparisonItems = [];
            selectedVendors = { A: '', B: '', C: '' };
            localStorage.removeItem('megatama_comparison_data');
            renderComparisonLayout(); // Memuat ulang layout untuk mereset kolom input pencarian
            
            Swal.fire({
                icon: 'success',
                title: 'Dibersihkan!',
                text: 'Tabel perbandingan telah dikosongkan.',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
}

window.changeVendor = function(col, vendorName) {
    selectedVendors[col] = String(vendorName).trim();
    autoFillPrices();
    renderComparisonTable();
}

const parseHarga = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return parseInt(String(val).replace(/\D/g, '')) || 0;
};

function autoFillPrices(specificItem = null) {
    const itemsToUpdate = specificItem ? [specificItem] : comparisonItems;
    itemsToUpdate.forEach(item => {
        if (!item.barang) return;
        const barangLower = item.barang.toLowerCase().trim();
        
        ['A', 'B', 'C'].forEach(col => {
            const vendorName = selectedVendors[col];
            if (vendorName) {
                const match = suppliersList.find(s => {
                    const sName = String(s.name || s.supplierName || s.nama || s.vendor || '').trim();
                    const sMat = String(s.material || s.namaMaterial || s.barang || '').trim().toLowerCase();
                    return sName === vendorName && sMat === barangLower;
                });
                if (match) {
                    item[`harga${col}`] = parseHarga(match.price || match.harga || match.hargaSatuan);
                    if (!item.satuan && match.satuan) {
                        item.satuan = match.satuan;
                    }
                }
            }
        });
    });
}

function renderComparisonLayout() {
    const container = document.getElementById('main-content');
    if (!container) return;

    // Buat HTML layout tabel
    const layout = `
        <datalist id="vendorList">
            ${uniqueVendors.map(v => `<option value="${v}">`).join('')}
        </datalist>
        <datalist id="materialList">
            ${uniqueMaterials.map(m => `<option value="${m}">`).join('')}
        </datalist>

        <!-- Header Title & Back Button -->
        <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-4">
                <button onclick="window.location.href='dashboard.html'" class="w-10 h-10 rounded-full bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-[#2A2A2A] text-slate-500 dark:text-[#A1A1AA] hover:text-[#FF7A00] dark:hover:text-[#FF7A00] hover:border-[#FF7A00] transition-all flex items-center justify-center shadow-sm">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <div>
                    <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Perbandingan Harga</h2>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Bandingkan harga material dari berbagai supplier.</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button id="themeToggle" class="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors" title="Ganti Tema">
                    <i class="fas fa-moon text-lg"></i>
                </button>
            </div>
        </div>

        <!-- STATS SECTION -->
        <div id="comparison-stats" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Total Item</p>
                        <h3 class="text-3xl font-bold text-slate-800 dark:text-white" id="stat-total-item">${comparisonItems.length}</h3>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500"><i class="fas fa-boxes"></i></div>
                </div>
            </div>
            <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Total RAP</p>
                        <h3 class="text-2xl font-bold text-slate-800 dark:text-white" id="stat-total-rap">Rp 0</h3>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center text-yellow-600"><i class="fas fa-wallet"></i></div>
                </div>
            </div>
            <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Vendor Termurah (Total)</p>
                        <h3 class="text-xl font-bold text-[#22C55E]" id="stat-best-vendor">-</h3>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-[#22C55E]"><i class="fas fa-award"></i></div>
                </div>
            </div>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="flex flex-wrap gap-3 mb-6">
            <button onclick="saveComparison()" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-lg shadow-sm font-semibold transition-colors flex items-center gap-2">
                <i class="fas fa-save"></i> Simpan
            </button>
            <button onclick="addItem()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg shadow-sm font-semibold transition-colors flex items-center gap-2">
                <i class="fas fa-plus"></i> Tambah Item
            </button>
            <button onclick="clearAllTable()" class="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg shadow-sm font-semibold transition-colors flex items-center gap-2">
                <i class="fas fa-broom"></i> Bersihkan
            </button>
            <button onclick="exportExcel()" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg shadow-sm font-semibold transition-colors flex items-center gap-2">
                <i class="fas fa-file-excel"></i> Export Excel
            </button>
            <button onclick="printPDF()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg shadow-sm font-semibold transition-colors flex items-center gap-2">
                <i class="fas fa-file-pdf"></i> Print PDF
            </button>
        </div>
        
        <!-- TABLE CONTAINER -->
        <div class="overflow-x-auto bg-white dark:bg-[#1A1A1A] rounded-2xl border border-slate-200 dark:border-[#2A2A2A] shadow-xl shadow-slate-200/40 dark:shadow-none">
            <table class="w-full text-sm border-collapse min-w-max" id="comparisonTable">
                <thead>
                    <tr>
                        <th rowspan="2" class="border-b border-r border-slate-200 dark:border-[#2A2A2A] p-4 bg-slate-100 dark:bg-[#1A1A1A] text-slate-600 dark:text-[#A1A1AA] font-semibold text-xs uppercase tracking-wider text-center whitespace-nowrap">NO</th>
                        <th rowspan="2" class="border-b border-r border-slate-200 dark:border-[#2A2A2A] p-4 bg-slate-100 dark:bg-[#1A1A1A] text-slate-600 dark:text-[#A1A1AA] font-semibold text-xs uppercase tracking-wider text-left min-w-[350px] whitespace-nowrap">BARANG DAN JASA</th>
                        <th rowspan="2" class="border-b border-r border-slate-200 dark:border-[#2A2A2A] p-4 bg-slate-100 dark:bg-[#1A1A1A] text-slate-600 dark:text-[#A1A1AA] font-semibold text-xs uppercase tracking-wider text-center min-w-[80px]">QTY</th>
                        <th rowspan="2" class="border-b border-r border-slate-200 dark:border-[#2A2A2A] p-4 bg-slate-100 dark:bg-[#1A1A1A] text-slate-600 dark:text-[#A1A1AA] font-semibold text-xs uppercase tracking-wider text-center min-w-[120px]">SATUAN</th>
                        <th colspan="2" class="border-b border-r border-slate-200 dark:border-[#2A2A2A] p-3 bg-blue-600 dark:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider whitespace-nowrap text-center shadow-inner">HARGA RAP</th>
                        
                        <th colspan="2" class="border-b border-r border-slate-200 dark:border-[#2A2A2A] p-3 bg-slate-50 dark:bg-[#121212] text-slate-700 dark:text-slate-300">
                            <div class="relative w-full min-w-[200px] mx-auto">
                                <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                                <input list="vendorList" type="text" class="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-[#2A2A2A] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-white font-semibold transition-shadow shadow-sm placeholder-slate-400" placeholder="Pilih Vendor A..." value="${selectedVendors.A}" onchange="changeVendor('A', this.value)">
                            </div>
                        </th>
                        <th colspan="2" class="border-b border-r border-slate-200 dark:border-[#2A2A2A] p-3 bg-slate-100/80 dark:bg-[#1E1E1E] text-slate-700 dark:text-slate-300">
                            <div class="relative w-full min-w-[200px] mx-auto">
                                <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                                <input list="vendorList" type="text" class="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-[#2A2A2A] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-white font-semibold transition-shadow shadow-sm placeholder-slate-400" placeholder="Pilih Vendor B..." value="${selectedVendors.B}" onchange="changeVendor('B', this.value)">
                            </div>
                        </th>
                        <th colspan="2" class="border-b border-r border-slate-200 dark:border-[#2A2A2A] p-3 bg-slate-50 dark:bg-[#121212] text-slate-700 dark:text-slate-300">
                            <div class="relative w-full min-w-[200px] mx-auto">
                                <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                                <input list="vendorList" type="text" class="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-[#2A2A2A] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-white font-semibold transition-shadow shadow-sm placeholder-slate-400" placeholder="Pilih Vendor C..." value="${selectedVendors.C}" onchange="changeVendor('C', this.value)">
                            </div>
                        </th>
                        
                        <th rowspan="2" class="border-b border-r border-slate-200 dark:border-[#2A2A2A] p-4 bg-slate-100 dark:bg-[#1A1A1A] text-slate-600 dark:text-[#A1A1AA] font-semibold text-xs uppercase tracking-wider text-left min-w-[800px] whitespace-nowrap">KET</th>
                        <th rowspan="2" class="border-b border-slate-200 dark:border-[#2A2A2A] p-4 bg-slate-100 dark:bg-[#1A1A1A] text-slate-600 dark:text-[#A1A1AA] font-semibold text-xs uppercase tracking-wider text-center min-w-[80px]">AKSI</th>
                    </tr>
                    <tr>
                        <th class="border-b border-r border-slate-200 dark:border-[#2A2A2A] p-2.5 bg-blue-500 dark:bg-blue-500 text-white font-medium text-xs tracking-wide w-32 text-center">Harga Satuan</th>
                        <th class="border-b border-r border-slate-200 dark:border-[#2A2A2A] p-2.5 bg-blue-500 dark:bg-blue-500 text-white font-medium text-xs tracking-wide w-32 text-center">Total</th>
                        <th class="border-b border-r border-slate-200 dark:border-[#2A2A2A] p-2.5 bg-slate-50 dark:bg-[#121212] text-slate-500 dark:text-[#A1A1AA] font-medium text-xs tracking-wide w-32 text-center">Harga Satuan</th>
                        <th class="border-b border-r border-slate-200 dark:border-[#2A2A2A] p-2.5 bg-slate-50 dark:bg-[#121212] text-slate-500 dark:text-[#A1A1AA] font-medium text-xs tracking-wide w-32 text-center">Total</th>
                        <th class="border-b border-r border-slate-200 dark:border-[#2A2A2A] p-2.5 bg-slate-100/80 dark:bg-[#1E1E1E] text-slate-500 dark:text-[#A1A1AA] font-medium text-xs tracking-wide w-32 text-center">Harga Satuan</th>
                        <th class="border-b border-r border-slate-200 dark:border-[#2A2A2A] p-2.5 bg-slate-100/80 dark:bg-[#1E1E1E] text-slate-500 dark:text-[#A1A1AA] font-medium text-xs tracking-wide w-32 text-center">Total</th>
                        <th class="border-b border-r border-slate-200 dark:border-[#2A2A2A] p-2.5 bg-slate-50 dark:bg-[#121212] text-slate-500 dark:text-[#A1A1AA] font-medium text-xs tracking-wide w-32 text-center">Harga Satuan</th>
                        <th class="border-b border-r border-slate-200 dark:border-[#2A2A2A] p-2.5 bg-slate-50 dark:bg-[#121212] text-slate-500 dark:text-[#A1A1AA] font-medium text-xs tracking-wide w-32 text-center">Total</th>
                    </tr>
                </thead>
                <tbody id="comparisonBody">
                </tbody>
                <tfoot id="comparisonFoot">
                </tfoot>
            </table>
        </div>
    `;

    // Timpa seluruh isi main-content dengan layout tabel
    container.innerHTML = layout;
    
    initThemeToggle(); // Panggil setelah tombolnya ada di DOM
    renderComparisonTable();
}

function renderComparisonTable() {
    const tbody = document.getElementById('comparisonBody');
    const tfoot = document.getElementById('comparisonFoot');
    if (!tbody || !tfoot) return;

    let html = '';
    let totalRap = 0, totalA = 0, totalB = 0, totalC = 0;
    
    // Logika warna untuk baris tabel individu
    const getPriceColor = (harga, rap) => {
        if (!harga || harga === 0) return 'text-slate-800 dark:text-white';
        if (!rap || rap === 0) return 'text-slate-800 dark:text-white'; // Belum ada RAP
        if (harga > rap) return 'text-red-600 dark:text-red-400 font-bold';
        if (harga < rap) return 'text-green-600 dark:text-green-400 font-bold';
        return 'text-yellow-600 dark:text-yellow-400 font-bold';
    };

    comparisonItems.forEach((item, index) => {
        const tRap = item.qty * item.hargaRap;
        const tA = item.qty * item.hargaA;
        const tB = item.qty * item.hargaB;
        const tC = item.qty * item.hargaC;

        totalRap += tRap; totalA += tA; totalB += tB; totalC += tC;
        
        const colorA = getPriceColor(item.hargaA, item.hargaRap);
        const colorB = getPriceColor(item.hargaB, item.hargaRap);
        const colorC = getPriceColor(item.hargaC, item.hargaRap);

        html += `
            <tr class="hover:bg-slate-50 dark:hover:bg-[#121212] group border-b border-slate-200 dark:border-[#2A2A2A] transition-colors">
                <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-3 text-center text-slate-500 dark:text-[#A1A1AA] font-medium">${index + 1}</td>
                <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-0"><input list="materialList" type="text" class="w-full h-full min-w-[350px] p-3 border-none bg-transparent hover:bg-slate-100/50 dark:hover:bg-[#1A1A1A] focus:bg-white dark:focus:bg-[#1A1A1A] text-left focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none dark:text-white transition-colors" value="${item.barang}" onchange="updateItem(${item.id}, 'barang', this.value)" placeholder="Nama Barang"></td>
                <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-0"><input type="number" class="w-full h-full min-w-[80px] p-3 border-none bg-transparent hover:bg-slate-100/50 dark:hover:bg-[#1A1A1A] focus:bg-white dark:focus:bg-[#1A1A1A] text-center focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none dark:text-white transition-colors" value="${item.qty}" onchange="updateItem(${item.id}, 'qty', this.value)"></td>
                <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-0"><input type="text" class="w-full h-full min-w-[120px] p-3 border-none bg-transparent hover:bg-slate-100/50 dark:hover:bg-[#1A1A1A] focus:bg-white dark:focus:bg-[#1A1A1A] text-center focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none dark:text-white transition-colors uppercase" value="${item.satuan}" onchange="updateItem(${item.id}, 'satuan', this.value)" placeholder="Satuan"></td>
                
                <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-0 bg-blue-50/50 dark:bg-blue-900/10"><input type="text" class="w-full h-full min-w-[140px] p-3 border-none bg-transparent hover:bg-blue-100/50 dark:hover:bg-blue-900/20 focus:bg-white dark:focus:bg-[#1A1A1A] text-right focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none font-semibold text-blue-900 dark:text-blue-300 transition-colors" value="${item.hargaRap.toLocaleString('id-ID')}" onchange="updateItem(${item.id}, 'hargaRap', this.value)" onkeyup="formatInput(this)"></td>
                <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-3 text-right bg-blue-50/50 dark:bg-blue-900/10 font-bold text-slate-800 dark:text-white min-w-[140px] whitespace-nowrap">${formatRp(tRap)}</td>
                
                <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-0"><input type="text" class="w-full h-full min-w-[140px] p-3 border-none bg-transparent hover:bg-slate-100/50 dark:hover:bg-[#1A1A1A] focus:bg-white dark:focus:bg-[#1A1A1A] text-right focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none transition-colors ${colorA}" value="${item.hargaA.toLocaleString('id-ID')}" onchange="updateItem(${item.id}, 'hargaA', this.value)" onkeyup="formatInput(this)"></td>
                <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-3 text-right ${colorA} min-w-[140px] whitespace-nowrap">${formatRp(tA)}</td>
                
                <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-0 bg-slate-50/50 dark:bg-[#1E1E1E]/50"><input type="text" class="w-full h-full min-w-[140px] p-3 border-none bg-transparent hover:bg-slate-100/50 dark:hover:bg-[#222] focus:bg-white dark:focus:bg-[#1A1A1A] text-right focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none transition-colors ${colorB}" value="${item.hargaB.toLocaleString('id-ID')}" onchange="updateItem(${item.id}, 'hargaB', this.value)" onkeyup="formatInput(this)"></td>
                <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-3 text-right bg-slate-50/50 dark:bg-[#1E1E1E]/50 ${colorB} min-w-[140px] whitespace-nowrap">${formatRp(tB)}</td>
                
                <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-0"><input type="text" class="w-full h-full min-w-[140px] p-3 border-none bg-transparent hover:bg-slate-100/50 dark:hover:bg-[#1A1A1A] focus:bg-white dark:focus:bg-[#1A1A1A] text-right focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none transition-colors ${colorC}" value="${item.hargaC.toLocaleString('id-ID')}" onchange="updateItem(${item.id}, 'hargaC', this.value)" onkeyup="formatInput(this)"></td>
                <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-3 text-right ${colorC} min-w-[140px] whitespace-nowrap">${formatRp(tC)}</td>
                
                <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-0"><input type="text" class="w-full h-full min-w-[400px] p-3 border-none bg-transparent hover:bg-slate-100/50 dark:hover:bg-[#1A1A1A] focus:bg-white dark:focus:bg-[#1A1A1A] text-left focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none dark:text-white text-slate-500 transition-colors" value="${item.ket}" onchange="updateItem(${item.id}, 'ket', this.value)" placeholder="Keterangan"></td>
                <td class="p-3 text-center min-w-[80px]">
                    <button onclick="removeItem(${item.id})" class="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center mx-auto opacity-0 group-hover:opacity-100 border border-red-100 dark:border-transparent" title="Hapus Item">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    if (comparisonItems.length === 0) {
        html = `
            <tr>
                <td colspan="14" class="p-16 text-center text-slate-500 dark:text-[#A1A1AA]">
                    <i class="fas fa-clipboard-list text-4xl mb-4 text-slate-300 dark:text-slate-600 block"></i>
                    <p class="text-base font-medium">Belum ada item untuk dibandingkan</p>
                    <p class="text-sm mt-1">Silakan klik "Tambah Item" untuk memulai.</p>
                </td>
            </tr>`;
    }

    tbody.innerHTML = html;

    const devA = totalA > 0 ? totalRap - totalA : 0;
    const devB = totalB > 0 ? totalRap - totalB : 0;
    const devC = totalC > 0 ? totalRap - totalC : 0;

    const devColor = (dev, total) => {
        if (total === 0) return 'text-slate-500 dark:text-slate-400';
        return dev < 0 ? 'text-red-600 dark:text-red-400 font-bold' : (dev > 0 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-yellow-600 dark:text-yellow-400 font-bold');
    };

    tfoot.innerHTML = `
        <tr class="font-bold bg-slate-100 dark:bg-[#1A1A1A] border-y border-slate-200 dark:border-[#2A2A2A] whitespace-nowrap">
            <td colspan="4" class="border-r border-slate-200 dark:border-[#2A2A2A] p-4 text-right text-slate-800 dark:text-white uppercase tracking-wider text-xs whitespace-nowrap">Total Pembelian</td>
            <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-4 bg-blue-100 dark:bg-blue-900/30"></td>
            <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-4 text-right bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-bold text-lg">${formatRp(totalRap)}</td>
            <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-4"></td>
            <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-4 text-right text-slate-800 dark:text-white text-lg">${formatRp(totalA)}</td>
            <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-4"></td>
            <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-4 text-right text-slate-800 dark:text-white text-lg bg-slate-50/50 dark:bg-[#1E1E1E]/50">${formatRp(totalB)}</td>
            <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-4"></td>
            <td class="border-r border-slate-200 dark:border-[#2A2A2A] p-4 text-right text-slate-800 dark:text-white text-lg">${formatRp(totalC)}</td>
            <td colspan="2" class="p-4"></td>
        </tr>
        <tr class="font-bold bg-slate-50 dark:bg-[#121212] border-b border-slate-200 dark:border-[#2A2A2A] whitespace-nowrap">
            <td colspan="4" class="border-r border-slate-200 dark:border-[#2A2A2A] p-4 text-right text-slate-800 dark:text-white uppercase tracking-wider text-xs whitespace-nowrap">Deviasi Terhadap RAP</td>
            <td colspan="2" class="border-r border-slate-200 dark:border-[#2A2A2A] p-4 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-900 dark:text-yellow-600 text-center text-lg">-</td>
            <td colspan="2" class="border-r border-slate-200 dark:border-[#2A2A2A] p-4 text-right ${devColor(devA, totalA)} text-base">${totalA > 0 ? formatRp(devA) : '-'}</td>
            <td colspan="2" class="border-r border-slate-200 dark:border-[#2A2A2A] p-4 text-right ${devColor(devB, totalB)} text-base bg-slate-100/50 dark:bg-[#1E1E1E]/50">${totalB > 0 ? formatRp(devB) : '-'}</td>
            <td colspan="2" class="border-r border-slate-200 dark:border-[#2A2A2A] p-4 text-right ${devColor(devC, totalC)} text-base">${totalC > 0 ? formatRp(devC) : '-'}</td>
            <td colspan="2" class="p-4"></td>
        </tr>
    `;

    // Update Top Stats
    const statTotalItem = document.getElementById('stat-total-item');
    const statTotalRap = document.getElementById('stat-total-rap');
    const statBestVendor = document.getElementById('stat-best-vendor');

    if (statTotalItem) statTotalItem.innerText = comparisonItems.length;
    if (statTotalRap) statTotalRap.innerText = formatRp(totalRap);

    if (statBestVendor) {
        let best = '-';
        let minTotal = Infinity;
        if (totalA > 0 && totalA < minTotal) { minTotal = totalA; best = selectedVendors.A || 'PT. A'; }
        if (totalB > 0 && totalB < minTotal) { minTotal = totalB; best = selectedVendors.B || 'PT. B'; }
        if (totalC > 0 && totalC < minTotal) { minTotal = totalC; best = selectedVendors.C || 'PT. C'; }
        statBestVendor.innerText = best;
    }
}

window.exportExcel = function() {
    const ws_data = [];
    
    ws_data.push(["NO", "BARANG DAN JASA", "QTY", "SATUAN", "HARGA RAP", "", "PT. A", "", "PT. B", "", "PT. C", "", "KET"]);
    ws_data.push(["", "", "", "", "Harga Satuan", "Total", "Harga Satuan", "Total", "Harga Satuan", "Total", "Harga Satuan", "Total", ""]);

    const merges = [
        { s: {r: 0, c: 0}, e: {r: 1, c: 0} }, 
        { s: {r: 0, c: 1}, e: {r: 1, c: 1} }, 
        { s: {r: 0, c: 2}, e: {r: 1, c: 2} }, 
        { s: {r: 0, c: 3}, e: {r: 1, c: 3} }, 
        { s: {r: 0, c: 4}, e: {r: 0, c: 5} }, 
        { s: {r: 0, c: 6}, e: {r: 0, c: 7} }, 
        { s: {r: 0, c: 8}, e: {r: 0, c: 9} }, 
        { s: {r: 0, c: 10}, e: {r: 0, c: 11} }, 
        { s: {r: 0, c: 12}, e: {r: 1, c: 12} }, 
    ];

    let totalRap = 0, totalA = 0, totalB = 0, totalC = 0;

    comparisonItems.forEach((item, idx) => {
        const tRap = item.qty * item.hargaRap;
        const tA = item.qty * item.hargaA;
        const tB = item.qty * item.hargaB;
        const tC = item.qty * item.hargaC;
        totalRap += tRap; totalA += tA; totalB += tB; totalC += tC;
        
        ws_data.push([
            idx + 1, item.barang, item.qty, item.satuan,
            item.hargaRap, tRap, item.hargaA, tA,
            item.hargaB, tB, item.hargaC, tC, item.ket
        ]);
    });

    const devA = totalA > 0 ? totalRap - totalA : 0;
    const devB = totalB > 0 ? totalRap - totalB : 0;
    const devC = totalC > 0 ? totalRap - totalC : 0;

    ws_data.push(["TOTAL", "", "", "", "", totalRap, "", totalA, "", totalB, "", totalC, ""]);
    merges.push({ s: {r: ws_data.length - 1, c: 0}, e: {r: ws_data.length - 1, c: 3} });

    ws_data.push(["DEVIASI TERHADAP RAP", "", "", "", "", "-", "", totalA > 0 ? devA : "-", "", totalB > 0 ? devB : "-", "", totalC > 0 ? devC : "-", ""]);
    merges.push({ s: {r: ws_data.length - 1, c: 0}, e: {r: ws_data.length - 1, c: 3} });
    merges.push({ s: {r: ws_data.length - 1, c: 4}, e: {r: ws_data.length - 1, c: 5} });
    merges.push({ s: {r: ws_data.length - 1, c: 6}, e: {r: ws_data.length - 1, c: 7} });
    merges.push({ s: {r: ws_data.length - 1, c: 8}, e: {r: ws_data.length - 1, c: 9} });
    merges.push({ s: {r: ws_data.length - 1, c: 10}, e: {r: ws_data.length - 1, c: 11} });

    if (typeof XLSX !== 'undefined') {
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        ws['!merges'] = merges;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Perbandingan Harga");
        XLSX.writeFile(wb, "Perbandingan_Harga.xlsx");
    } else {
        Swal.fire('Error', 'Library SheetJS tidak ditemukan.', 'error');
    }
}

window.printPDF = async function() {
    if (typeof window.jspdf === 'undefined') {
        Swal.fire('Error', 'Library jsPDF tidak ditemukan.', 'error');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(14);
    doc.text('PERBANDINGAN HARGA VENDOR', 14, 20);
    
    const head = [
        [
            { content: 'NO', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            { content: 'BARANG DAN JASA', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            { content: 'QTY', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            { content: 'SATUAN', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            { content: 'HARGA RAP', colSpan: 2, styles: { halign: 'center', fillColor: [59, 130, 246], textColor: [255, 255, 255] } },
            { content: 'PT. A', colSpan: 2, styles: { halign: 'center' } },
            { content: 'PT. B', colSpan: 2, styles: { halign: 'center' } },
            { content: 'PT. C', colSpan: 2, styles: { halign: 'center' } },
            { content: 'KET', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
        ],
        [
            { content: 'Harga Satuan', styles: { halign: 'center', fillColor: [96, 165, 250], textColor: [255, 255, 255] } },
            { content: 'Total', styles: { halign: 'center', fillColor: [96, 165, 250], textColor: [255, 255, 255] } },
            { content: 'Harga Satuan', styles: { halign: 'center' } },
            { content: 'Total', styles: { halign: 'center' } },
            { content: 'Harga Satuan', styles: { halign: 'center' } },
            { content: 'Total', styles: { halign: 'center' } },
            { content: 'Harga Satuan', styles: { halign: 'center' } },
            { content: 'Total', styles: { halign: 'center' } }
        ]
    ];
    
    const body = [];
    const getPdfColor = (harga, rap) => {
        if (!harga || harga === 0 || !rap || rap === 0) return [50, 50, 50]; 
        if (harga > rap) return [220, 38, 38]; 
        if (harga < rap) return [22, 163, 74]; 
        return [202, 138, 4];
    };

    let totalRap = 0, totalA = 0, totalB = 0, totalC = 0;

    comparisonItems.forEach((item, idx) => {
        const tRap = item.qty * item.hargaRap;
        const tA = item.qty * item.hargaA;
        const tB = item.qty * item.hargaB;
        const tC = item.qty * item.hargaC;
        totalRap += tRap; totalA += tA; totalB += tB; totalC += tC;
        
        body.push([
            { content: idx + 1, styles: { halign: 'center' } },
            item.barang,
            { content: item.qty, styles: { halign: 'center' } },
            item.satuan,
            { content: formatRp(item.hargaRap), styles: { halign: 'right', fillColor: [239, 246, 255] } },
            { content: formatRp(tRap), styles: { halign: 'right', fillColor: [239, 246, 255] } },
            { content: formatRp(item.hargaA), styles: { halign: 'right', textColor: getPdfColor(item.hargaA, item.hargaRap), fontStyle: item.hargaA ? 'bold' : 'normal' } },
            { content: formatRp(tA), styles: { halign: 'right', textColor: getPdfColor(item.hargaA, item.hargaRap), fontStyle: tA ? 'bold' : 'normal' } },
            { content: formatRp(item.hargaB), styles: { halign: 'right', textColor: getPdfColor(item.hargaB, item.hargaRap), fontStyle: item.hargaB ? 'bold' : 'normal' } },
            { content: formatRp(tB), styles: { halign: 'right', textColor: getPdfColor(item.hargaB, item.hargaRap), fontStyle: tB ? 'bold' : 'normal' } },
            { content: formatRp(item.hargaC), styles: { halign: 'right', textColor: getPdfColor(item.hargaC, item.hargaRap), fontStyle: item.hargaC ? 'bold' : 'normal' } },
            { content: formatRp(tC), styles: { halign: 'right', textColor: getPdfColor(item.hargaC, item.hargaRap), fontStyle: tC ? 'bold' : 'normal' } },
            item.ket
        ]);
    });

    const devA = totalA > 0 ? totalRap - totalA : 0;
    const devB = totalB > 0 ? totalRap - totalB : 0;
    const devC = totalC > 0 ? totalRap - totalC : 0;

    body.push([
        { content: 'TOTAL', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: '', styles: { fillColor: [219, 234, 254] } },
        { content: formatRp(totalRap), styles: { halign: 'right', fontStyle: 'bold', fillColor: [219, 234, 254] } },
        { content: '' },
        { content: formatRp(totalA), styles: { halign: 'right', fontStyle: 'bold' } },
        { content: '' },
        { content: formatRp(totalB), styles: { halign: 'right', fontStyle: 'bold' } },
        { content: '' },
        { content: formatRp(totalC), styles: { halign: 'right', fontStyle: 'bold' } },
        { content: '' }
    ]);

    const getDevPdfColor = (dev, total) => {
        if (total === 0) return [50, 50, 50];
        return dev < 0 ? [220, 38, 38] : (dev > 0 ? [22, 163, 74] : [202, 138, 4]);
    };

    body.push([
        { content: 'DEVIASI TERHADAP RAP', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: '-', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [254, 240, 138] } },
        { content: totalA > 0 ? formatRp(devA) : '-', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', textColor: getDevPdfColor(devA, totalA) } },
        { content: totalB > 0 ? formatRp(devB) : '-', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', textColor: getDevPdfColor(devB, totalB) } },
        { content: totalC > 0 ? formatRp(devC) : '-', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', textColor: getDevPdfColor(devC, totalC) } },
        { content: '' }
    ]);

    doc.autoTable({
        startY: 25,
        head: head,
        body: body,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, textColor: [50, 50, 50] },
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], lineWidth: 0.1, lineColor: [203, 213, 225] }
    });

    doc.save('Perbandingan_Harga.pdf');
}