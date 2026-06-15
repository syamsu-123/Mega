import { getProjectById, getMaterialsByProjectId, addMaterial, updateMaterial, deleteMaterial } from './firebase-service.js';

let currentProjectId = null;
let currentProject = null;
let materialsList = [];
let currentPoFilter = 'All';
let currentSearchQuery = '';
let userRole = localStorage.getItem('userRole') || 'Viewer';
let currentPage = 1;
const itemsPerPage = 20;

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

    const urlParams = new URLSearchParams(window.location.search);
    currentProjectId = urlParams.get('id');

    if (!currentProjectId) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Load Project Data
    currentProject = await getProjectById(currentProjectId);
    if (!currentProject) {
        const isDark = document.documentElement.classList.contains('dark');
        Swal.fire({
            icon: 'error',
            title: 'Proyek Tidak Ditemukan',
            text: 'Mengarahkan kembali ke dashboard...',
            background: isDark ? '#1A1A1A' : '#ffffff',
            color: isDark ? '#ffffff' : '#1e293b'
        }).then(() => window.location.href = 'dashboard.html');
        return;
    }

    // Keamanan Ekstra: Pastikan Klien (Viewer) hanya bisa melihat Material dari Proyek miliknya
    if (userRole === 'Viewer') {
        const projectCodeAuth = localStorage.getItem('projectCode') || localStorage.getItem('userName') || '';
        const isDark = document.documentElement.classList.contains('dark');
        const cleanCodeAuth = String(projectCodeAuth).split('@')[0].replace(/\s+/g, '').toUpperCase();
        const cleanProjectCode = currentProject.code ? String(currentProject.code).replace(/\s+/g, '').toUpperCase() : '';
        
        if (cleanProjectCode !== cleanCodeAuth) {
            Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'Anda tidak memiliki izin melihat logistik proyek ini.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' })
            .then(() => window.location.href = 'dashboard.html');
            return;
        }
    }

    document.title = `Monitoring Material - ${currentProject.name}`;
    document.getElementById('header-project-name').innerText = currentProject.code ? `[${currentProject.code}] ${currentProject.name}` : currentProject.name;
    
    // Show admin buttons if user has access
    if (userRole !== 'Viewer') {
        document.getElementById('admin-actions').style.display = 'flex';
    }

    await loadMaterials();

    document.getElementById('loading-indicator').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
});

async function loadMaterials() {
    materialsList = await getMaterialsByProjectId(currentProjectId);
    renderStats();
    renderTable();
}

function renderStats() {
    const statsContainer = document.getElementById('material-stats');
    
    const uniqueMaterials = {};
    materialsList.forEach(m => {
        const code = m.itemCode && m.itemCode.trim() !== '' ? m.itemCode.trim().toUpperCase() : m.id;
        if (!uniqueMaterials[code]) {
            uniqueMaterials[code] = { mto: m.mto || 0, qtyPo: 0 };
        }
        uniqueMaterials[code].qtyPo += (m.target || 0);
        uniqueMaterials[code].mto = Math.max(uniqueMaterials[code].mto, m.mto || 0);
    });

    let totalItems = Object.keys(uniqueMaterials).length;
    let unfulfilledItems = 0;
    let fulfilledItems = 0;

    Object.values(uniqueMaterials).forEach(m => {
        if (m.qtyPo >= m.mto) fulfilledItems++;
        else unfulfilledItems++;
    });

    statsContainer.innerHTML = `
        <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Total Jenis Material</p>
                    <h3 class="text-3xl font-bold text-slate-800 dark:text-white">${totalItems}</h3>
                </div>
                <div class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500"><i class="fas fa-boxes"></i></div>
            </div>
        </div>
        <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Sudah Terpenuhi</p>
                    <h3 class="text-3xl font-bold text-[#22C55E]">${fulfilledItems}</h3>
                </div>
                <div class="w-10 h-10 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-[#22C55E]"><i class="fas fa-check-circle"></i></div>
            </div>
        </div>
        <div class="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-[#2A2A2A] shadow-sm transition-colors duration-300">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-slate-500 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider mb-1">Belum Terpenuhi</p>
                    <h3 class="text-3xl font-bold text-[#EF4444]">${unfulfilledItems}</h3>
                </div>
                <div class="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-[#EF4444]"><i class="fas fa-exclamation-triangle"></i></div>
            </div>
        </div>
    `;
}

function getFilteredMaterials() {
    let list = [...materialsList]; // Copy array agar data asli (sebelum difilter) tetap aman
    if (currentPoFilter !== 'All') {
        list = list.filter(m => (m.poStatus || 'Belum PO') === currentPoFilter);
    }
    if (currentSearchQuery.trim() !== '') {
        const q = currentSearchQuery.toLowerCase();
        list = list.filter(m => 
            (m.name && String(m.name).toLowerCase().includes(q)) ||
                (m.itemCode && String(m.itemCode).toLowerCase().includes(q)) ||
                (m.poNumber && String(m.poNumber).toLowerCase().includes(q))
        );
    }

    // Mengurutkan berdasarkan Kode Item dan Nama Material agar item yang sama saling mengelompok
    list.sort((a, b) => {
        const codeA = (a.itemCode || '').toLowerCase();
        const codeB = (b.itemCode || '').toLowerCase();
        if (codeA < codeB) return -1;
        if (codeA > codeB) return 1;
        
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });

    return list;
}

function renderTable() {
    const tableContainer = document.getElementById('materials-table');
    
    let displayList = getFilteredMaterials();
    
    // --- PAGINATION LOGIC ---
    const totalPages = Math.ceil(displayList.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, displayList.length);
    
    const paginatedList = displayList.slice(startIndex, endIndex);

    const paginationControls = document.getElementById('pagination-controls');
    const paginationInfo = document.getElementById('pagination-info');
    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');

    if (displayList.length === 0) {
        if (paginationControls) paginationControls.classList.add('hidden');
        tableContainer.innerHTML = `<tr><td colspan="100%" class="p-8 text-center text-slate-500 dark:text-[#A1A1AA] italic">Tidak ada data material yang sesuai.</td></tr>`;
        return;
    }

    if (displayList.length > itemsPerPage) {
        if (paginationControls) paginationControls.classList.remove('hidden');
        if (paginationInfo) paginationInfo.innerText = `Menampilkan ${startIndex + 1} - ${endIndex} dari ${displayList.length} data`;
        
        if (btnPrev) btnPrev.disabled = currentPage === 1;
        if (btnNext) btnNext.disabled = currentPage === totalPages;
    } else {
        if (paginationControls) paginationControls.classList.add('hidden');
    }
    // -----------------------

    const cumulativeQtyByCode = {};
    materialsList.forEach(m => {
        if (m.itemCode && m.itemCode.trim() !== '') {
            const code = m.itemCode.trim().toUpperCase();
            cumulativeQtyByCode[code] = (cumulativeQtyByCode[code] || 0) + (m.target || 0);
        }
    });

    let thead = `
        <thead>
            <tr class="text-xs uppercase text-slate-500 dark:text-[#A1A1AA] border-b border-slate-200 dark:border-[#2A2A2A]">
                ${userRole !== 'Viewer' ? '<th class="p-4 font-semibold text-center w-10"><input type="checkbox" id="check-all-materials" onchange="toggleAllMaterialChecks(this)" class="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-slate-50 dark:bg-[#121212] border-slate-200 dark:border-[#2A2A2A] cursor-pointer"></th>' : ''}
                <th class="p-4 font-semibold text-center w-12">No</th>
                <th class="p-4 font-semibold">Kode Item</th>
                <th class="p-4 font-semibold w-1/5">Item Material</th>
                <th class="p-4 font-semibold text-right w-24 whitespace-nowrap">MTO</th>
                <th class="p-4 font-semibold text-right w-32 whitespace-nowrap">Quantity PO</th>
                <th class="p-4 font-semibold text-center">Satuan</th>
                <th class="p-4 font-semibold text-center">Status Material</th>
                <th class="p-4 font-semibold text-center">Status PO</th>
                <th class="p-4 font-semibold">No PO</th>
                <th class="p-4 font-semibold">Lead Time / Remarks</th>
                <th class="p-4 font-semibold">Keterangan</th>
                ${userRole !== 'Viewer' ? `<th class="p-4 font-semibold text-center">
                    <span id="aksi-title">Aksi</span>
                    <div id="bulk-actions" class="hidden items-center justify-center gap-2">
                        <button id="btn-edit-selected" onclick="editSelectedMaterials()" class="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-600 transition-colors whitespace-nowrap shadow-sm"><i class="fas fa-edit mr-1"></i>Edit (<span id="count-selected-edit">0</span>)</button>
                        <button id="btn-delete-selected" onclick="deleteSelectedMaterials()" class="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-600 transition-colors whitespace-nowrap shadow-sm"><i class="fas fa-trash mr-1"></i>Hapus (<span id="count-selected-delete">0</span>)</button>
                    </div>
                </th>` : ''}
            </tr>
        </thead>
        <tbody>
    `;

    let tbody = paginatedList.map((m, index) => {
        let rowNumber = startIndex + index + 1;
        const mto = m.mto || 0;
        const qtyPo = m.target || 0;

        let totalCumulativePo = qtyPo;
        if (m.itemCode && m.itemCode.trim() !== '') {
            const code = m.itemCode.trim().toUpperCase();
            if (cumulativeQtyByCode[code]) {
                totalCumulativePo = cumulativeQtyByCode[code];
            }
        }
        
        let statusBadge = '<span class="bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap">Belum Terpenuhi</span>';
        if (totalCumulativePo > mto) {
            statusBadge = '<span class="bg-red-100 dark:bg-[#EF4444]/10 text-[#EF4444] border border-red-200 dark:border-[#EF4444]/20 px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap">Over Quantity</span>';
        } else if (totalCumulativePo === mto && mto > 0) {
            statusBadge = '<span class="bg-green-100 dark:bg-[#22C55E]/10 text-[#22C55E] border border-green-200 dark:border-[#22C55E]/20 px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap">Sudah Terpenuhi</span>';
        }

        let poStatusBadge = '<span class="bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20 px-2.5 py-1 rounded text-[10px] font-bold whitespace-nowrap">Belum PO</span>';
        
        if (m.poStatus === 'Sudah PO dan Payment') {
            poStatusBadge = '<span class="bg-green-100 dark:bg-[#22C55E]/10 text-[#22C55E] border border-green-200 dark:border-[#22C55E]/20 px-2.5 py-1 rounded text-[10px] font-bold whitespace-nowrap">PO & Paid</span>';
        } else if (m.poStatus === 'Sudah PO belum Payment') {
            poStatusBadge = '<span class="bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2.5 py-1 rounded text-[10px] font-bold whitespace-nowrap">PO Unpaid</span>';
        }

        return `
            <tr class="border-b border-slate-200 dark:border-[#2A2A2A] hover:bg-slate-50 dark:hover:bg-[#121212] transition-colors">
                ${userRole !== 'Viewer' ? `<td class="p-4 text-center"><input type="checkbox" class="material-checkbox w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-slate-50 dark:bg-[#121212] border-slate-200 dark:border-[#2A2A2A] cursor-pointer" value="${m.id}" onchange="updateSelectedCount()"></td>` : ''}
                <td class="p-4 text-sm text-center text-slate-500 dark:text-[#A1A1AA]">${rowNumber}</td>
                <td class="p-4 text-sm font-semibold text-slate-800 dark:text-white">${m.itemCode || '-'}</td>
                <td class="p-4">
                    <p class="text-sm font-semibold text-slate-800 dark:text-white">${m.name}</p>
                </td>
                <td class="p-4 text-right">
                    <p class="text-sm font-semibold text-slate-800 dark:text-white">${(m.mto || 0).toLocaleString('id-ID')}</p>
                </td>
                <td class="p-4 text-right">
                    <p class="text-sm font-semibold text-slate-800 dark:text-white">${qtyPo.toLocaleString('id-ID')}</p>
                    ${totalCumulativePo !== qtyPo ? `<p class="text-[10px] text-blue-500 dark:text-blue-400 font-semibold mt-0.5">Total PO: ${totalCumulativePo.toLocaleString('id-ID')}</p>` : ''}
                    ${(m.used || 0) > 0 ? `<p class="text-[10px] text-blue-500">Terpakai: ${(m.used || 0).toLocaleString('id-ID')}</p>` : ''}
                </td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA] text-center">${m.unit}</td>
                <td class="p-4 text-center">${statusBadge}</td>
                <td class="p-4 text-center">${poStatusBadge}</td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA]">${m.poNumber || '-'}</td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA]">${m.leadTime || '-'}</td>
                <td class="p-4 text-sm text-slate-500 dark:text-[#A1A1AA]">${m.description || '-'}</td>
                ${userRole !== 'Viewer' ? `
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="updateMaterialProgress('${m.id}')" class="w-8 h-8 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center border border-blue-100 dark:border-transparent" title="Update Data Material"><i class="fas fa-edit text-xs"></i></button>
                        <button onclick="deleteMaterialItem('${m.id}')" class="w-8 h-8 rounded bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-100 dark:border-transparent" title="Hapus"><i class="fas fa-trash text-xs"></i></button>
                    </div>
                </td>
                ` : ''}
            </tr>
        `;
    }).join('');

    tableContainer.innerHTML = thead + tbody + '</tbody>';
}

window.openAddMaterialModal = function() {
    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
        title: 'Tambah Daftar Material',
        background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b',
        html: `
            <input id="swal-m-code" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-blue-500" placeholder="Kode Item (Opsional, cth: ITM-001)">
            <input id="swal-m-name" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-blue-500" placeholder="Item Material (cth: Semen Portland)">
            <input id="swal-m-mto" type="number" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-blue-500" placeholder="Volume MTO (Angka)">
            <input id="swal-m-target" type="number" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-blue-500" placeholder="Quantity PO (Angka)">
            <input id="swal-m-unit" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-blue-500" placeholder="Satuan (cth: Sak / Ton / m3)">
            <select id="swal-m-po" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-blue-500 cursor-pointer">
                <option value="Belum PO">Status: Belum PO</option>
                <option value="Sudah PO belum Payment">Status: Sudah PO belum Payment</option>
                <option value="Sudah PO dan Payment">Status: Sudah PO dan Payment</option>
            </select>
            <input id="swal-m-pono" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-blue-500" placeholder="Nomor PO (Opsional, cth: PO-001/2024)">
            <input id="swal-m-lead" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none mb-3 text-slate-800 dark:text-white focus:border-blue-500" placeholder="Lead Time / Remarks (Opsional)">
            <textarea id="swal-m-desc" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500 resize-none" rows="2" placeholder="Keterangan (Opsional)"></textarea>
        `,
        showCancelButton: true,
        confirmButtonColor: '#3B82F6',
        cancelButtonColor: isDark ? '#2A2A2A' : '#64748B',
        confirmButtonText: 'Simpan',
        didOpen: () => {
            const codeInput = document.getElementById('swal-m-code');
            const nameInput = document.getElementById('swal-m-name');
            const mtoInput = document.getElementById('swal-m-mto');
            const unitInput = document.getElementById('swal-m-unit');

            if (codeInput) {
                codeInput.addEventListener('input', (e) => {
                    const val = e.target.value.trim().toUpperCase();
                    const existingItem = materialsList.find(m => m.itemCode && m.itemCode.trim().toUpperCase() === val);
                    if (existingItem) {
                        nameInput.value = existingItem.name || '';
                        mtoInput.value = existingItem.mto || '';
                        unitInput.value = existingItem.unit || '';
                        
                        [nameInput, mtoInput, unitInput].forEach(input => input.classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-300', 'dark:border-blue-700'));
                    } else {
                        [nameInput, mtoInput, unitInput].forEach(input => input.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-300', 'dark:border-blue-700'));
                    }
                });
            }
        },
        preConfirm: () => {
            const itemCode = document.getElementById('swal-m-code').value;
            const name = document.getElementById('swal-m-name').value;
            const mto = parseFloat(document.getElementById('swal-m-mto').value) || 0;
            const target = parseFloat(document.getElementById('swal-m-target').value);
            const unit = document.getElementById('swal-m-unit').value;
            const poStatus = document.getElementById('swal-m-po').value;
            const poNumber = document.getElementById('swal-m-pono').value;
            const leadTime = document.getElementById('swal-m-lead').value;
            const description = document.getElementById('swal-m-desc').value;
            if(!name || !unit || isNaN(target)) { Swal.showValidationMessage('Item Material, Quantity PO, dan Satuan wajib diisi!'); return false; }
            return { projectId: currentProjectId, itemCode, name, unit, mto, target, used: 0, poStatus, poNumber, leadTime, description, timestamp: Date.now() };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

            const newItem = result.value;
            const res = await addMaterial(newItem); // Selalu menambahkan sebagai data baru

            if (res) {
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Material ditambahkan sebagai data baru.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b', confirmButtonColor: '#3B82F6' });
                loadMaterials();
            } else {
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan server.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' });
            }
        }
    });
}

window.filterByPoStatus = function(status) {
    currentPoFilter = status;
    currentPage = 1;
    renderTable();
};

window.filterBySearch = function(query) {
    currentSearchQuery = query;
    currentPage = 1;
    renderTable();
};

window.prevPage = function() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
};

window.nextPage = function() {
    const displayList = getFilteredMaterials();
    const totalPages = Math.ceil(displayList.length / itemsPerPage);
    
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
};

// ====================================
// INTEGRASI IMPORT & EXPORT EXCEL/PDF
// ====================================

window.exportToExcel = function() {
    let exportList = getFilteredMaterials();

    if (exportList.length === 0) {
        Swal.fire('Info', 'Tidak ada data material untuk diexport.', 'info');
        return;
    }

    const cumulativeQtyByCode = {};
    materialsList.forEach(m => {
        if (m.itemCode && m.itemCode.trim() !== '') {
            const code = m.itemCode.trim().toUpperCase();
            cumulativeQtyByCode[code] = (cumulativeQtyByCode[code] || 0) + (m.target || 0);
        }
    });

    const data = exportList.map((m, index) => {
        const mto = m.mto || 0;
        const qtyPo = m.target || 0;

        let totalCumulativePo = qtyPo;
        if (m.itemCode && m.itemCode.trim() !== '') {
            totalCumulativePo = cumulativeQtyByCode[m.itemCode.trim().toUpperCase()] || qtyPo;
        }

        let status = 'Belum Terpenuhi';
        if (totalCumulativePo > mto) status = 'Over Quantity';
        else if (totalCumulativePo === mto && mto > 0) status = 'Sudah Terpenuhi';

        return {
            'No': index + 1,
            'Kode Item': m.itemCode || '-',
            'Item Material': m.name,
            'Volume MTO': m.mto || 0,
            'Quantity PO': m.target,
            'Satuan': m.unit,
            'Status Material': status,
            'Status PO': m.poStatus || 'Belum PO',
            'No PO': m.poNumber || '-',
            'Lead Time / Remarks': m.leadTime || '-',
            'Keterangan': m.description || '-'
        };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Material");
    
    const safeName = currentProject ? currentProject.name.replace(/[^a-z0-9]/gi, '_') : 'Proyek';
    XLSX.writeFile(wb, `Logistik_Material_${safeName}.xlsx`);
};

window.exportToPDF = function() {
    let exportList = getFilteredMaterials();

    if (exportList.length === 0) {
        Swal.fire('Info', 'Tidak ada data material untuk diexport.', 'info');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text(`Laporan Monitoring Material - ${currentProject ? currentProject.name : ''}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 28);

    const tableColumn = ["No", "Kode Item", "Item Material", "MTO", "Quantity PO", "Satuan", "Status Material", "Status PO", "No PO", "Lead Time", "Keterangan"];
    const tableRows = [];

    const cumulativeQtyByCode = {};
    materialsList.forEach(m => {
        if (m.itemCode && m.itemCode.trim() !== '') {
            const code = m.itemCode.trim().toUpperCase();
            cumulativeQtyByCode[code] = (cumulativeQtyByCode[code] || 0) + (m.target || 0);
        }
    });

    exportList.forEach((m, index) => {
        const mto = m.mto || 0;
        const qtyPo = m.target || 0;

        let totalCumulativePo = qtyPo;
        if (m.itemCode && m.itemCode.trim() !== '') {
            totalCumulativePo = cumulativeQtyByCode[m.itemCode.trim().toUpperCase()] || qtyPo;
        }

        let status = 'Belum Terpenuhi';
        if (totalCumulativePo > mto) status = 'Over Quantity';
        else if (totalCumulativePo === mto && mto > 0) status = 'Sudah Terpenuhi';

        tableRows.push([
            index + 1,
            m.itemCode || '-',
            m.name,
            (m.mto || 0).toLocaleString('id-ID'),
            m.target.toLocaleString('id-ID'),
            m.unit,
            status,
            m.poStatus || 'Belum PO',
            m.poNumber || '-',
            m.leadTime || '-',
            m.description || '-'
        ]);
    });

    doc.autoTable({
        head: [tableColumn], body: tableRows, startY: 35, theme: 'grid',
        styles: { fontSize: 9, font: 'helvetica' },
        headStyles: { fillColor: [59, 130, 246] } // Theme Blue
    });

    const safeName = currentProject ? currentProject.name.replace(/[^a-z0-9]/gi, '_') : 'Proyek';
    doc.save(`Logistik_Material_${safeName}.pdf`);
};

window.showImportInstructions = function() {
    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
        title: 'Panduan Import Excel',
        width: '600px',
        background: isDark ? '#1A1A1A' : '#ffffff',
        color: isDark ? '#ffffff' : '#1e293b',
        html: `
            <div class="text-left text-sm mb-4 text-slate-600 dark:text-[#A1A1AA]">
                <p class="mb-3">Pastikan file Excel Anda memiliki struktur kolom (baris pertama) seperti contoh tabel berikut:</p>
                <div class="overflow-x-auto border border-slate-200 dark:border-[#2A2A2A] rounded-lg mb-4">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-slate-100 dark:bg-[#121212] font-semibold text-slate-700 dark:text-white">
                            <tr>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">No</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Kode Item</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Item Material</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Volume MTO</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Quantity PO</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Satuan</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Status PO</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">No PO</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Lead Time / Remarks</th>
                                <th class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody class="text-slate-600 dark:text-[#A1A1AA]">
                            <tr>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">1</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">ITM-001</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Semen Portland</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">600</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">500</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Sak</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Sudah PO dan Payment</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">PO-2024-001</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">2 Hari</td>
                                <td class="p-2 border-b border-slate-200 dark:border-[#2A2A2A]">Vendor A</td>
                            </tr>
                            <tr>
                                <td class="p-2">2</td>
                                <td class="p-2">ITM-002</td>
                                <td class="p-2">Besi Beton 12mm</td>
                                <td class="p-2">1500</td>
                                <td class="p-2">1200</td>
                                <td class="p-2">Btg</td>
                                <td class="p-2">Belum PO</td>
                                <td class="p-2">-</td>
                                <td class="p-2">1 Minggu</td>
                                <td class="p-2">Urgent</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <ul class="list-disc pl-5 space-y-1 text-xs mb-4">
                    <li>Kolom <b>Item Material</b>, <b>Quantity PO</b>, dan <b>Satuan</b> wajib diisi.</li>
                    <li>Sistem dapat mendeteksi variasi nama kolom secara otomatis (misal: <i>Item, Target, Remarks</i>).</li>
                </ul>
                <button onclick="downloadExcelTemplate()" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold underline transition-colors"><i class="fas fa-download mr-1"></i> Download Template Excel Kosong</button>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-file-upload mr-2"></i> Pilih File',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#3B82F6',
        cancelButtonColor: isDark ? '#2A2A2A' : '#64748B',
    }).then((result) => {
        if (result.isConfirmed) {
            document.getElementById('import-excel-file').click();
        }
    });
};

window.downloadExcelTemplate = function() {
    const templateData = [
        { 'No': 1, 'Kode Item': 'ITM-001', 'Item Material': 'Semen Portland', 'Volume MTO': 600, 'Quantity PO': 500, 'Satuan': 'Sak', 'Status PO': 'Sudah PO dan Payment', 'No PO': 'PO-2024-001', 'Lead Time / Remarks': '2 Hari', 'Keterangan': 'Vendor A' },
        { 'No': 2, 'Kode Item': 'ITM-002', 'Item Material': 'Batu Bata Merah', 'Volume MTO': 12000, 'Quantity PO': 10000, 'Satuan': 'Pcs', 'Status PO': 'Sudah PO belum Payment', 'No PO': 'PO-2024-002', 'Lead Time / Remarks': '5 Hari', 'Keterangan': '' },
        { 'No': 3, 'Kode Item': 'ITM-003', 'Item Material': 'Pipa PVC 4 Inch', 'Volume MTO': 200, 'Quantity PO': 150, 'Satuan': 'Batang', 'Status PO': 'Belum PO', 'No PO': '', 'Lead Time / Remarks': 'Ready Stock', 'Keterangan': 'Gudang Pusat' }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Material");
    XLSX.writeFile(wb, 'Template_Import_Material.xlsx');
};

window.handleImportExcel = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const isDark = document.documentElement.classList.contains('dark');
    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            const json = XLSX.utils.sheet_to_json(worksheet);
            
            if (json.length === 0) {
                event.target.value = '';
                return Swal.fire({ icon: 'warning', title: 'Data Kosong', text: 'File Excel kosong!', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' });
            }

            // Kumpulkan semua nama header/kolom yang ada di Excel
            let excelHeaders = new Set();
            json.forEach(row => Object.keys(row).forEach(k => excelHeaders.add(k)));
            excelHeaders = Array.from(excelHeaders);

            const fields = [
                { id: 'map-no', label: 'No', aliases: ['no', 'nomor', 'number'] },
                { id: 'map-code', label: 'Kode Item', aliases: ['kode', 'item code', 'kode item'] },
                { id: 'map-name', label: 'Item Material *', aliases: ['nama', 'item', 'material', 'deskripsi'], required: true },
                { id: 'map-mto', label: 'Volume MTO', aliases: ['mto', 'volume', 'kebutuhan'] },
                { id: 'map-target', label: 'Quantity PO *', aliases: ['qty', 'target', 'jumlah', 'quantity', 'po'], required: true },
                { id: 'map-unit', label: 'Satuan *', aliases: ['unit', 'ukuran'], required: true },
                { id: 'map-po', label: 'Status PO', aliases: ['status po', 'status pembayaran', 'status'] },
                { id: 'map-pono', label: 'No PO', aliases: ['no po', 'nomor po', 'po number', 'po'] },
                { id: 'map-lead', label: 'Lead Time / Remarks', aliases: ['lead time', 'remarks', 'waktu'] },
                { id: 'map-desc', label: 'Keterangan', aliases: ['desc', 'catatan', 'vendor'] }
            ];

            let mapHtml = `
                <div class="text-left text-sm text-slate-600 dark:text-[#A1A1AA] mb-4">
                    Sistem membaca kolom yang berbeda. Silakan sesuaikan kolom dari file Excel Anda dengan format sistem di bawah ini:
                </div>
                <div class="space-y-3 text-left">
            `;

            fields.forEach(f => {
                let options = `<option value="">-- Abaikan / Tidak Ada --</option>`;
                let matched = false;
                excelHeaders.forEach(h => {
                    let hLower = h.toLowerCase();
                    let baseLabel = f.label.toLowerCase().replace(' *', '');
                    let isMatch = !matched && (hLower.includes(baseLabel) || f.aliases.some(a => hLower.includes(a)));
                    if (isMatch) matched = true;
                    options += `<option value="${h}" ${isMatch ? 'selected' : ''}>${h}</option>`;
                });
                
                mapHtml += `
                    <div>
                        <label class="block text-xs font-semibold text-slate-800 dark:text-white mb-1">${f.label}</label>
                        <select id="${f.id}" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded p-2 outline-none text-slate-800 dark:text-white text-sm focus:border-blue-500">
                            ${options}
                        </select>
                    </div>
                `;
            });
            mapHtml += `</div>`;

            // 1. Tampilkan Dialog Mapping Kolom (Pemetaan Dinamis)
            const mappingResult = await Swal.fire({
                title: 'Mapping Kolom Excel',
                html: mapHtml,
                background: isDark ? '#1A1A1A' : '#ffffff',
                color: isDark ? '#ffffff' : '#1e293b',
                showCancelButton: true,
                confirmButtonColor: '#3B82F6',
                cancelButtonColor: isDark ? '#2A2A2A' : '#64748B',
                confirmButtonText: 'Lanjut Pratinjau',
                cancelButtonText: 'Batal',
                preConfirm: () => {
                    const mapped = {};
                    let missing = [];
                    fields.forEach(f => {
                        const val = document.getElementById(f.id).value;
                        if (f.required && !val) missing.push(f.label.replace(' *', ''));
                        mapped[f.id] = val;
                    });
                    if (missing.length > 0) {
                        Swal.showValidationMessage(`Kolom ${missing.join(', ')} wajib dipetakan!`);
                        return false;
                    }
                    return mapped;
                }
            });

            if (!mappingResult.isConfirmed) {
                event.target.value = '';
                return;
            }

            const mappings = mappingResult.value;

            // 2. Ekstrak Data Berdasarkan Hasil Pemetaan Tadi
            const parsedData = [];

            for (const row of json) {
                const noStr = mappings['map-no'] ? row[mappings['map-no']] : '';
                const itemCode = mappings['map-code'] ? row[mappings['map-code']] : '';
                const name = mappings['map-name'] ? row[mappings['map-name']] : '';
                const mtoStr = mappings['map-mto'] ? row[mappings['map-mto']] : null;
                let mto = mtoStr !== null && mtoStr !== undefined ? parseFloat(mtoStr) : 0;
                const targetStr = mappings['map-target'] ? row[mappings['map-target']] : null;
                const unit = mappings['map-unit'] ? row[mappings['map-unit']] : '';
                const poStatus = mappings['map-po'] ? row[mappings['map-po']] : 'Belum PO';
                const poNumber = mappings['map-pono'] ? row[mappings['map-pono']] : '';
                const leadTime = mappings['map-lead'] ? row[mappings['map-lead']] : '';
                const description = mappings['map-desc'] ? row[mappings['map-desc']] : '';

                if (name && unit && targetStr !== null && targetStr !== undefined) {
                    const target = parseFloat(targetStr);
                    if (!isNaN(target)) {
                        const cleanCode = itemCode ? String(itemCode).trim() : '';
                        if (cleanCode !== '') {
                            const existingItem = materialsList.find(m => m.itemCode && m.itemCode.trim().toUpperCase() === cleanCode.toUpperCase());
                            if (existingItem && (isNaN(mto) || mto === 0)) {
                                mto = existingItem.mto || 0;
                            }
                        }
                        parsedData.push({ projectId: currentProjectId, no: noStr, itemCode: cleanCode, name: String(name).trim(), unit: String(unit).trim(), mto: isNaN(mto) ? 0 : mto, target: target, used: 0, poStatus: poStatus ? String(poStatus).trim() : 'Belum PO', poNumber: poNumber ? String(poNumber).trim() : '', leadTime: leadTime ? String(leadTime).trim() : '', description: description ? String(description).trim() : '', timestamp: Date.now() });
                    }
                }
            }

            if (parsedData.length === 0) {
                event.target.value = '';
                return Swal.fire({ icon: 'warning', title: 'Data Kosong', text: 'Tidak ada baris data yang valid berdasarkan pemetaan kolom Anda.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' });
            }

            // 3. Tampilkan HTML Pratinjau
            let previewHtml = `
                <p class="text-sm text-slate-500 dark:text-[#A1A1AA] mb-4 text-left">Ditemukan <b>${parsedData.length}</b> data valid yang siap diimport.</p>
                <div class="max-h-60 overflow-auto text-left text-sm bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-3">
                    <table class="w-full border-collapse">
                        <thead>
                            <tr class="border-b border-slate-200 dark:border-[#2A2A2A] text-slate-500 dark:text-[#A1A1AA]">
                                <th class="py-2 text-center w-12">No</th>
                                <th class="py-2 text-left w-1/5">Kode</th>
                                <th class="py-2 text-left w-2/5">Item Material</th>
                                <th class="py-2 text-center w-1/5">MTO</th>
                                <th class="py-2 text-center w-1/5">Qty PO</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            parsedData.slice(0, 10).forEach(d => {
                previewHtml += `
                    <tr class="border-b border-slate-200 dark:border-[#2A2A2A] text-slate-800 dark:text-white last:border-0">
                        <td class="py-2 text-center">${d.no || '-'}</td>
                        <td class="py-2 truncate max-w-[100px]" title="${d.itemCode}">${d.itemCode || '-'}</td>
                        <td class="py-2 truncate max-w-[150px]" title="${d.name}">${d.name}</td>
                        <td class="py-2 text-center">${(d.mto || 0).toLocaleString('id-ID')}</td>
                        <td class="py-2 text-center">${d.target.toLocaleString('id-ID')} ${d.unit}</td>
                    </tr>
                `;
            });
            previewHtml += `</tbody></table></div>`;
            if (parsedData.length > 10) {
                previewHtml += `<p class="text-xs text-center text-slate-500 dark:text-[#A1A1AA] mt-3 italic">...dan ${parsedData.length - 10} baris lainnya.</p>`;
            }

            // 4. Modal Konfirmasi & Proses Simpan ke Database
            Swal.fire({
                title: 'Pratinjau Import',
                html: previewHtml,
                background: isDark ? '#1A1A1A' : '#ffffff',
                color: isDark ? '#ffffff' : '#1e293b',
                showCancelButton: true,
                confirmButtonColor: '#3B82F6',
                cancelButtonColor: isDark ? '#2A2A2A' : '#64748B',
                confirmButtonText: 'Ya, Import Sekarang',
                cancelButtonText: 'Batal'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    Swal.fire({ title: 'Memproses Import...', text: `Mengimport ${parsedData.length} baris material.`, background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                    
                    let successCount = 0;
                    for (const item of parsedData) {
                        await addMaterial(item);
                        successCount++;
                    }
                    
                    Swal.fire({ icon: 'success', title: 'Import Selesai', text: `Berhasil memproses ${successCount} baris data material.`, background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b', confirmButtonColor: '#3B82F6' });
                    loadMaterials();
                }
            }).finally(() => {
                event.target.value = '';
            });

        } catch (error) { 
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Format Excel tidak valid.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' }); 
            event.target.value = ''; 
        } 
    };
    reader.readAsArrayBuffer(file);
};

window.updateMaterialProgress = function(id) {
    const m = materialsList.find(x => x.id === id);
    if (!m) return;
    const isDark = document.documentElement.classList.contains('dark');
    
    Swal.fire({
        title: `Update Data Material<br><span class="text-sm font-normal text-blue-500">${m.name}</span>`,
        background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b',
        html: `
            <div class="mb-3">
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Volume MTO</label>
                <input id="swal-m-mto" type="number" value="${m.mto || 0}" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500">
            </div>
            <div class="mb-3">
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Quantity PO</label>
                <input id="swal-m-target" type="number" value="${m.target || 0}" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500">
            </div>
            <div class="mb-3">
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Total Digunakan Baru</label>
                <input id="swal-m-used" type="number" value="${m.used || 0}" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500">
            </div>
            <div class="mb-3">
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Status PO</label>
                <select id="swal-m-po" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500 cursor-pointer">
                    <option value="Belum PO" ${m.poStatus === 'Belum PO' || !m.poStatus ? 'selected' : ''}>Belum PO</option>
                    <option value="Sudah PO belum Payment" ${m.poStatus === 'Sudah PO belum Payment' ? 'selected' : ''}>Sudah PO belum Payment</option>
                    <option value="Sudah PO dan Payment" ${m.poStatus === 'Sudah PO dan Payment' ? 'selected' : ''}>Sudah PO dan Payment</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Nomor PO</label>
                <input id="swal-m-pono" type="text" value="${m.poNumber || ''}" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500" placeholder="Nomor PO (Opsional)">
            </div>
            <div class="mb-3">
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Lead Time / Remarks</label>
                <input id="swal-m-lead" type="text" value="${m.leadTime || ''}" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] text-left mb-1">Keterangan</label>
                <textarea id="swal-m-desc" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500 resize-none" rows="2">${m.description || ''}</textarea>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#3B82F6',
        cancelButtonColor: isDark ? '#2A2A2A' : '#64748B',
        confirmButtonText: 'Update',
        preConfirm: () => {
            const mto = parseFloat(document.getElementById('swal-m-mto').value) || 0;
            const target = parseFloat(document.getElementById('swal-m-target').value) || 0;
            const used = parseFloat(document.getElementById('swal-m-used').value) || 0;
            const poStatus = document.getElementById('swal-m-po').value;
            const poNumber = document.getElementById('swal-m-pono').value;
            const leadTime = document.getElementById('swal-m-lead').value;
            const description = document.getElementById('swal-m-desc').value;
            if(isNaN(target) || target < 0) { Swal.showValidationMessage('Masukkan Quantity PO yang valid!'); return false; }
            return { mto, target, used, poStatus, poNumber, leadTime, description };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Mengupdate...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            try {
                const res = await updateMaterial(id, { mto: result.value.mto, target: result.value.target, used: result.value.used, poStatus: result.value.poStatus, poNumber: result.value.poNumber, leadTime: result.value.leadTime, description: result.value.description });
                if (res !== false) {
                    // Update local state agar tabel berubah secara instan
                    const idx = materialsList.findIndex(m => m.id === id);
                    if (idx !== -1) {
                        materialsList[idx] = { ...materialsList[idx], ...result.value };
                    }
                    renderStats();
                    renderTable();
                    Swal.fire({ icon: 'success', title: 'Terupdate', text: 'Data material diperbarui.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b', confirmButtonColor: '#3B82F6' });
                } else {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan pada database.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' });
                }
            } catch (error) {
                console.error("Update error:", error);
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan sistem saat mengupdate data.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' });
            }
        }
    });
}

window.deleteMaterialItem = function(id) {
    if (!id || id === 'undefined') {
        Swal.fire({
            icon: 'error', title: 'Data Tidak Valid', text: 'ID Material tidak terdeteksi. Pastikan getMaterialsByProjectId di firebase-service.js me-return id.',
            background: document.documentElement.classList.contains('dark') ? '#1A1A1A' : '#ffffff', color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1e293b'
        });
        return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
        title: 'Hapus Item Material?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: isDark ? '#2A2A2A' : '#64748B',
        confirmButtonText: 'Hapus',
        background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b'
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            try {
                const res = await deleteMaterial(id);
                // Mengecek apakah function tidak secara spesifik mengembalikan nilai false
                if (res !== false) {
                    await loadMaterials(); // Memaksa muat ulang & sinkronisasi dari server Firebase
                    Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Item material berhasil dihapus.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b', confirmButtonColor: '#3B82F6' });
                } else {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus item dari database. Periksa Aturan (Rules) Firebase Anda.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' });
                }
            } catch (error) {
                console.error("Delete error:", error);
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan sistem saat menghapus.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' });
            }
        }
    });
}

window.toggleAllMaterialChecks = function(source) {
    const checkboxes = document.querySelectorAll('.material-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = source.checked;
    });
    updateSelectedCount();
};

window.updateSelectedCount = function() {
    const checkboxes = document.querySelectorAll('.material-checkbox:checked');
    const count = checkboxes.length;
    const aksiTitle = document.getElementById('aksi-title');
    const bulkActions = document.getElementById('bulk-actions');
    const countSpanEdit = document.getElementById('count-selected-edit');
    const countSpanDelete = document.getElementById('count-selected-delete');
    const checkAll = document.getElementById('check-all-materials');
    
    if (count > 0) {
        if (aksiTitle) aksiTitle.classList.add('hidden');
        if (bulkActions) {
            bulkActions.classList.remove('hidden');
            bulkActions.classList.add('flex');
        }
        if (countSpanEdit) countSpanEdit.innerText = count;
        if (countSpanDelete) countSpanDelete.innerText = count;
    } else {
        if (aksiTitle) aksiTitle.classList.remove('hidden');
        if (bulkActions) {
            bulkActions.classList.add('hidden');
            bulkActions.classList.remove('flex');
        }
    }

    if (checkAll) {
        const totalCheckboxes = document.querySelectorAll('.material-checkbox').length;
        checkAll.checked = count > 0 && count === totalCheckboxes;
    }
};

window.deleteSelectedMaterials = function() {
    const checkboxes = document.querySelectorAll('.material-checkbox:checked');
    const idsToDelete = Array.from(checkboxes).map(cb => cb.value).filter(id => id && id !== 'undefined');

    if (idsToDelete.length === 0) return;
    const isDark = document.documentElement.classList.contains('dark');
    
    Swal.fire({
        title: `Hapus ${idsToDelete.length} Item?`,
        text: "Data material yang terpilih akan dihapus permanen!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: isDark ? '#2A2A2A' : '#64748B',
        confirmButtonText: 'Ya, Hapus Semua',
        background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b'
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            let successCount = 0;
            try {
                for (const id of idsToDelete) {
                    const res = await deleteMaterial(id);
                    if (res !== false) {
                        successCount++;
                    }
                }
                
                await loadMaterials(); // Memaksa muat ulang & sinkronisasi dari server Firebase
                const checkAll = document.getElementById('check-all-materials');
                if (checkAll) checkAll.checked = false;
                
                if (successCount > 0) {
                    Swal.fire({ icon: 'success', title: 'Terhapus', text: `${successCount} data berhasil dihapus.`, background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b', confirmButtonColor: '#3B82F6' });
                } else {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus data dari database. Periksa Aturan (Rules) Firebase Anda.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' });
                }
            } catch (error) {
                console.error("Delete massal error:", error);
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan sistem saat menghapus data.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' });
            }
        }
    });
};

window.editSelectedMaterials = function() {
    const checkboxes = document.querySelectorAll('.material-checkbox:checked');
    const idsToEdit = Array.from(checkboxes).map(cb => cb.value).filter(id => id && id !== 'undefined');

    if (idsToEdit.length === 0) return;

    const isDark = document.documentElement.classList.contains('dark');
    
    Swal.fire({
        title: `Update ${idsToEdit.length} Material Terpilih`,
        background: isDark ? '#1A1A1A' : '#ffffff',
        color: isDark ? '#ffffff' : '#1e293b',
        html: `
            <p class="text-sm text-slate-500 dark:text-slate-400 text-left mb-4">Hanya field yang diisi yang akan diupdate. Kosongkan field jika tidak ingin mengubah nilainya.</p>
            <div class="space-y-4 text-left">
                <div>
                    <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] mb-1">Status PO</label>
                    <select id="swal-bulk-po" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500 cursor-pointer">
                        <option value="">-- Jangan Ubah --</option>
                        <option value="Belum PO">Belum PO</option>
                        <option value="Sudah PO belum Payment">Sudah PO belum Payment</option>
                        <option value="Sudah PO dan Payment">Sudah PO dan Payment</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] mb-1">Nomor PO</label>
                    <input id="swal-bulk-pono" type="text" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500" placeholder="Isi untuk mengubah semua">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] mb-1">Lead Time / Remarks</label>
                    <input id="swal-bulk-lead" type="text" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500" placeholder="Isi untuk mengubah semua">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-500 dark:text-[#A1A1AA] mb-1">Keterangan</glabel>
                    <textarea id="swal-bulk-desc" class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2A2A2A] rounded-lg p-2.5 outline-none text-slate-800 dark:text-white focus:border-blue-500 resize-none" rows="2" placeholder="Isi untuk mengubah semua"></textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#3B82F6', // Blue color
        cancelButtonColor: isDark ? '#2A2A2A' : '#64748B',
        confirmButtonText: 'Update Semua',
        preConfirm: () => {
            const poStatus = document.getElementById('swal-bulk-po').value;
            const poNumber = document.getElementById('swal-bulk-pono').value;
            const leadTime = document.getElementById('swal-bulk-lead').value;
            const description = document.getElementById('swal-bulk-desc').value;

            const dataToUpdate = {};
            if (poStatus) dataToUpdate.poStatus = poStatus;
            if (poNumber) dataToUpdate.poNumber = poNumber;
            if (leadTime) dataToUpdate.leadTime = leadTime;
            if (description) dataToUpdate.description = description;

            if (Object.keys(dataToUpdate).length === 0) {
                Swal.showValidationMessage('Tidak ada perubahan yang diisi.');
                return false;
            }
            return dataToUpdate;
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            const dataToUpdate = result.value;
            Swal.fire({ title: 'Mengupdate...', text: `Memproses ${idsToEdit.length} data...`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
            let successCount = 0;
            try {
                for (const id of idsToEdit) {
                    const res = await updateMaterial(id, dataToUpdate);
                    if (res !== false) successCount++;
                }
                
                await loadMaterials();
                const checkAll = document.getElementById('check-all-materials');
                if (checkAll) checkAll.checked = false;
                
                if (successCount > 0) {
                    Swal.fire({ icon: 'success', title: 'Update Berhasil', text: `${successCount} data berhasil diupdate.`, background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b', confirmButtonColor: '#3B82F6' });
                } else {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengupdate data di database.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' });
                }
            } catch (error) {
                console.error("Bulk update error:", error);
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan sistem saat mengupdate data.', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' });
            }
        }
    });
};