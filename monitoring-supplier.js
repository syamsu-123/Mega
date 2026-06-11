import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from './src/js/firebase-service.js';

let suppliersList = [];
let currentSearchQuery = '';
let userRole = localStorage.getItem('userRole') || 'Viewer';

// --- Multi-Language System (Google Translate Auto-Switch) ---
function initLanguageToggle() {
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

    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn && !document.getElementById('langToggleBtn')) {
        const langBtn = document.createElement('button');
        langBtn.id = 'langToggleBtn';
        langBtn.className = 'flex items-center justify-center gap-1.5 w-10 h-10 rounded-full text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors';
        langBtn.innerHTML = `<i class="fas fa-globe text-lg"></i>`;
        langBtn.title = currentLang === 'ID' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia';
        langBtn.addEventListener('click', handleLangSwitch);
        themeBtn.parentNode.insertBefore(langBtn, themeBtn);
    }
}
initLanguageToggle();

document.addEventListener('DOMContentLoaded', async () => {
    const themeToggleBtn = document.getElementById('themeToggle');

    // Cek preferensi tema dari localStorage
    if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-sun text-lg"></i>';
    } else {
        document.documentElement.classList.remove('dark');
        if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-moon text-lg"></i>';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            themeToggleBtn.innerHTML = isDark ? '<i class="fas fa-sun text-lg"></i>' : '<i class="fas fa-moon text-lg"></i>';
        });
    }

    // Show admin buttons if user has access
    if (userRole !== 'Viewer') {
        document.getElementById('admin-actions').style.display = 'flex';
    }

    await loadSuppliers();

    document.getElementById('loading-indicator').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
});

async function loadSuppliers() {
    suppliersList = await getSuppliers();
    renderStats();
    renderTable();
}

function renderStats() {
    const statsContainer = document.getElementById('supplier-stats');
    const total = suppliersList.length;
    let active = 0;
    suppliersList.forEach(s => { if (s.status === 'Aktif') active++; });

    statsContainer.innerHTML = `
        <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Total Supplier Terdata</p>
                    <h3 class="text-3xl font-bold text-slate-800 dark:text-white">${total}</h3>
                </div>
                <div class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500"><i class="fas fa-users"></i></div>
            </div>
        </div>
        <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Supplier Aktif</p>
                    <h3 class="text-3xl font-bold text-[#22C55E]">${active}</h3>
                </div>
                <div class="w-10 h-10 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-[#22C55E]"><i class="fas fa-check-circle"></i></div>
            </div>
        </div>
        <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Barang Dilacak</p>
                    <h3 class="text-3xl font-bold text-[#FF7A00]">${total}</h3>
                </div>
                <div class="w-10 h-10 rounded-full bg-orange-50 dark:bg-[#FF7A00]/10 flex items-center justify-center text-[#FF7A00]"><i class="fas fa-box-open"></i></div>
            </div>
        </div>
    `;
}

function renderTable() {
    const tableContainer = document.getElementById('suppliers-table');
    
    let displayList = suppliersList;
    if (currentSearchQuery.trim() !== '') {
        const q = currentSearchQuery.toLowerCase();
        displayList = displayList.filter(s => 
            (s.name && String(s.name).toLowerCase().includes(q)) ||
            (s.material && String(s.material).toLowerCase().includes(q))
        );
    }
    
    if (displayList.length === 0) {
        tableContainer.innerHTML = '<tr><td colspan="9" class="p-8 text-center text-slate-500 dark:text-[#A1A1AA] italic">Tidak ada data supplier / harga.</td></tr>';
        return;
    }

    let tbody = displayList.map((s, index) => {
        let statusBadge = s.status === 'Aktif' 
            ? '<span class="bg-green-100 dark:bg-[#22C55E]/10 text-[#22C55E] px-2 py-1 rounded text-xs font-bold border border-green-200 dark:border-[#22C55E]/20">Aktif</span>' 
            : '<span class="bg-red-100 dark:bg-[#EF4444]/10 text-[#EF4444] px-2 py-1 rounded text-xs font-bold border border-red-200 dark:border-[#EF4444]/20">Non-Aktif</span>';

        const priceFmt = s.price ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(s.price) : '-';
        const dateFmt = s.timestamp ? new Date(s.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

        return `
            <tr class="border-b border-slate-200 dark:border-[#2A2A2A] hover:bg-slate-50 dark:hover:bg-[#121212] transition-colors">
                <td class="p-4 text-sm text-center text-slate-500 dark:text-[#A1A1AA]">${index + 1}</td>
                <td class="p-4"><p class="text-sm font-semibold text-slate-800 dark:text-white">${s.name}</p></td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA]">${s.material}</td>
                <td class="p-4 text-right">
                    <p class="text-sm font-bold text-[#FF7A00]">${priceFmt}</p>
                    <p class="text-[10px] text-slate-500 dark:text-[#A1A1AA]">per ${s.unit}</p>
                </td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA]">${s.contact || '-'}</td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA]">${dateFmt}</td>
                <td class="p-4 text-center">${statusBadge}</td>
                ${userRole !== 'Viewer' ? `
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="editSupplierItem('${s.id}')" class="w-8 h-8 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center border border-blue-100 dark:border-transparent" title="Edit"><i class="fas fa-edit text-xs"></i></button>
                        <button onclick="deleteSupplierItem('${s.id}')" class="w-8 h-8 rounded bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-100 dark:border-transparent" title="Hapus"><i class="fas fa-trash text-xs"></i></button>
                    </div>
                </td>
                ` : ''}
            </tr>
        `;
    }).join('');

    tableContainer.innerHTML = `
        <thead>
            <tr class="text-xs uppercase text-slate-500 dark:text-[#A1A1AA] border-b border-slate-200 dark:border-[#2A2A2A]">
                <th class="p-4 font-semibold text-center w-12">No</th>
                <th class="p-4 font-semibold">Nama Supplier / Vendor</th>
                <th class="p-4 font-semibold">Bahan Material</th>
                <th class="p-4 font-semibold text-right">Harga Update</th>
                <th class="p-4 font-semibold">Kontak</th>
                <th class="p-4 font-semibold">Tanggal Update</th>
                <th class="p-4 font-semibold text-center">Status</th>
                ${userRole !== 'Viewer' ? '<th class="p-4 font-semibold text-center">Aksi</th>' : ''}
            </tr>
        </thead>
        <tbody>${tbody}</tbody>`;
}

window.filterBySearch = function(query) { currentSearchQuery = query; renderTable(); };

window.openAddSupplierModal = function() {
    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
        title: 'Tambah Supplier Baru', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b',
        html: `
            <input id="swal-s-name" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 mb-3 text-slate-800 dark:text-white outline-none focus:border-[#FF7A00]" placeholder="Nama Supplier / Vendor">
            <input id="swal-s-mat" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 mb-3 text-slate-800 dark:text-white outline-none focus:border-[#FF7A00]" placeholder="Material Barang (cth: Besi Beton)">
            <div class="flex gap-3 mb-3">
                <input id="swal-s-price" type="number" class="w-2/3 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-[#FF7A00]" placeholder="Harga Satuan (Rp)">
                <input id="swal-s-unit" class="w-1/3 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-[#FF7A00]" placeholder="Satuan (cth: Kg)">
            </div>
            <input id="swal-s-contact" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 mb-3 text-slate-800 dark:text-white outline-none focus:border-[#FF7A00]" placeholder="Kontak (No Telepon / Email)">
            <select id="swal-s-status" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 text-slate-800 dark:text-white outline-none cursor-pointer focus:border-[#FF7A00]">
                <option value="Aktif">Status: Aktif</option><option value="Non-Aktif">Status: Non-Aktif</option>
            </select>`,
        showCancelButton: true, confirmButtonColor: '#FF7A00', cancelButtonColor: isDark ? '#2A2A2A' : '#64748B', confirmButtonText: 'Simpan',
        preConfirm: () => ({ name: document.getElementById('swal-s-name').value, material: document.getElementById('swal-s-mat').value, price: parseFloat(document.getElementById('swal-s-price').value) || 0, unit: document.getElementById('swal-s-unit').value, contact: document.getElementById('swal-s-contact').value, status: document.getElementById('swal-s-status').value, timestamp: Date.now() })
    }).then(async (result) => {
        if (result.isConfirmed) { Swal.fire({ title: 'Menyimpan...', didOpen: () => Swal.showLoading() }); await addSupplier(result.value); Swal.fire('Berhasil!', 'Data tersimpan.', 'success'); loadSuppliers(); }
    });
};

window.deleteSupplierItem = function(id) { const isDark = document.documentElement.classList.contains('dark'); Swal.fire({ title: 'Hapus Supplier?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#EF4444', confirmButtonText: 'Hapus', cancelButtonColor: isDark ? '#2A2A2A' : '#64748B', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' }).then(async (res) => { if (res.isConfirmed) { await deleteSupplier(id); Swal.fire('Terhapus!', 'Data dihapus.', 'success'); loadSuppliers(); } }); };

window.editSupplierItem = function(id) {
    const supplier = suppliersList.find(s => s.id === id);
    if (!supplier) return;
    
    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
        title: 'Edit Data Supplier', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b',
        html: `
            <input id="swal-s-name" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 mb-3 text-slate-800 dark:text-white outline-none focus:border-[#FF7A00]" placeholder="Nama Supplier / Vendor" value="${supplier.name || ''}">
            <input id="swal-s-mat" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 mb-3 text-slate-800 dark:text-white outline-none focus:border-[#FF7A00]" placeholder="Material Barang (cth: Besi Beton)" value="${supplier.material || ''}">
            <div class="flex gap-3 mb-3">
                <input id="swal-s-price" type="number" class="w-2/3 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-[#FF7A00]" placeholder="Harga Satuan (Rp)" value="${supplier.price || ''}">
                <input id="swal-s-unit" class="w-1/3 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 text-slate-800 dark:text-white outline-none focus:border-[#FF7A00]" placeholder="Satuan (cth: Kg)" value="${supplier.unit || ''}">
            </div>
            <input id="swal-s-contact" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 mb-3 text-slate-800 dark:text-white outline-none focus:border-[#FF7A00]" placeholder="Kontak (No Telepon / Email)" value="${supplier.contact || ''}">
            <select id="swal-s-status" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 text-slate-800 dark:text-white outline-none cursor-pointer focus:border-[#FF7A00]">
                <option value="Aktif" ${supplier.status === 'Aktif' ? 'selected' : ''}>Status: Aktif</option><option value="Non-Aktif" ${supplier.status === 'Non-Aktif' ? 'selected' : ''}>Status: Non-Aktif</option>
            </select>`,
        showCancelButton: true, confirmButtonColor: '#FF7A00', cancelButtonColor: isDark ? '#2A2A2A' : '#64748B', confirmButtonText: 'Update',
        preConfirm: () => ({ name: document.getElementById('swal-s-name').value, material: document.getElementById('swal-s-mat').value, price: parseFloat(document.getElementById('swal-s-price').value) || 0, unit: document.getElementById('swal-s-unit').value, contact: document.getElementById('swal-s-contact').value, status: document.getElementById('swal-s-status').value, timestamp: Date.now() })
    }).then(async (result) => {
        if (result.isConfirmed) { Swal.fire({ title: 'Menyimpan Perubahan...', didOpen: () => Swal.showLoading() }); await updateSupplier(id, result.value); Swal.fire('Berhasil!', 'Data diperbarui.', 'success'); loadSuppliers(); }
    });
};