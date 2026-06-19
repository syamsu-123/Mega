import { getProjectById, listenToKasByProjectId, addKas, updateKas, deleteKas, updateProject, listenToProjectById } from './firebase-service.js';

let currentProjectId = null;
let currentProject = null;
let kasList = [];
let currentSearchQuery = '';
let userRole = localStorage.getItem('userRole') || 'Viewer';

// Value untuk kalkulasi laporan
let totalActualPengeluaran = 0;

// Debounce timer untuk auto-save RAP
let autoSaveRapTimer = null;

// Fungsi auto-save RAP ke Firebase (dengan debounce 1 detik)
window.autoSaveRapData = function() {
    if (autoSaveRapTimer) clearTimeout(autoSaveRapTimer);

    autoSaveRapTimer = setTimeout(async () => {
        const rapValues = {};
        document.querySelectorAll('#resume-actual-table tbody input[data-code]').forEach(input => {
            const code = input.dataset.code;
            const value = parseInt(input.value.replace(/\D/g, '')) || 0;
            rapValues[code] = value;
        });

        const reportData = { rap: rapValues };

        try {
            await updateProject(currentProjectId, { reportData });
            console.log('RAP data auto-saved:', rapValues);
        } catch (error) {
            console.error('Gagal auto-save RAP:', error);
        }
    }, 1000); // 1 detik delay
};

// Chart instances
let signatureData = {
    dibuat: 'Project Manager',
    diperiksa: 'Site Manager',
    disetujui: 'Direktur'
};

let realisasiChartInst = null;
let perbandinganChartInst = null;
let kasListenerUnsubscribe = null;
let projectListenerUnsubscribe = null;

// Pagination variables
let currentPage = 1;
const itemsPerPage = 20;

const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const themeToggleBtn = document.getElementById('themeToggle');

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
            renderCharts(); // Re-render charts on theme change
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    currentProjectId = urlParams.get('id');

    if (!currentProjectId) {
        window.location.href = 'dashboard.html';
        return;
    }

    setupProjectListener();

    // Load saved signature data
    const savedSignatures = localStorage.getItem('kas_signatures');
    if (savedSignatures) {
        signatureData = JSON.parse(savedSignatures);
    }

    // Inject Print-specific styles and Signature block
    const style = document.createElement('style');
    style.innerHTML = `
        @media print {
            body * { visibility: hidden; }
            #main-content, #main-content * { visibility: visible; }
            #main-content { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print, .no-print * { display: none !important; }
            .print-only { display: block !important; }
            .swal2-container { display: none !important; }
        }
    `;
    document.head.appendChild(style);

    const signatureContainer = document.createElement('div');
    signatureContainer.id = 'signature-container';
    signatureContainer.className = 'print-only hidden mt-16'; // Hidden by default, shown on print
    document.getElementById('main-content').appendChild(signatureContainer);

    if (userRole !== 'Viewer') {
        const adminActions = document.getElementById('admin-actions');
        if(adminActions) {
            adminActions.classList.remove('hidden');
            adminActions.classList.add('flex-wrap', 'justify-end', 'gap-y-2'); // Ensure wrapping, alignment, and vertical gap
            adminActions.insertAdjacentHTML('beforeend', `
                <button onclick="window.saveReportData()" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 no-print shadow-sm hidden"><i class="fas fa-save"></i> Simpan Laporan</button>
                <button onclick="window.showImportInstructions()" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 no-print"><i class="fas fa-file-excel"></i> Import Excel</button>
                <button onclick="window.showSignatureModal()" class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 no-print"><i class="fas fa-signature"></i> Atur TTD</button>
                <button onclick="window.exportToPDF()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 no-print"><i class="fas fa-file-pdf"></i> Export PDF</button>
            `);
        }
    }
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.id = 'import-excel-file';
    importInput.className = 'hidden';
    importInput.accept = ".xlsx, .xls";
    importInput.onchange = handleImportExcel;
    document.body.appendChild(importInput);

    // Load PDF generation scripts dynamically
    try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    } catch (error) {
        console.error("Gagal memuat library untuk PDF:", error);
        const pdfButton = document.querySelector('button[onclick="window.exportToPDF()"]');
        if (pdfButton) {
            pdfButton.disabled = true;
            pdfButton.title = "Gagal memuat library PDF";
        }
    }

    setupKasListener();

    document.getElementById('loading-indicator').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
});

function setupProjectListener() {
    if (projectListenerUnsubscribe) {
        projectListenerUnsubscribe();
    }
    projectListenerUnsubscribe = listenToProjectById(currentProjectId, (projectData) => {
        if (!projectData) {
            // Handle error, maybe redirect or show message
            return;
        }
        currentProject = projectData;
        // UPDATE HEADER
        document.title = `Monitoring Kas - ${currentProject.name}`;
        document.getElementById('header-project-name').innerText = currentProject.code ? `[${currentProject.code}] ${currentProject.name}` : currentProject.name;
        if(document.getElementById('header-location')) document.getElementById('header-location').innerText = currentProject.location || 'Lokasi tidak diketahui';
        if(document.getElementById('header-status')) document.getElementById('header-status').innerText = currentProject.status || 'Aktif';
        if(document.getElementById('header-period')) document.getElementById('header-period').innerText = `${currentProject.start || '-'} s/d ${currentProject.end || '-'}`;
        if(document.getElementById('header-last-update')) document.getElementById('header-last-update').innerText = new Date().toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'});
        if(document.getElementById('prog-actual-text')) {
            const prog = currentProject.progress || 0;
            document.getElementById('prog-actual-text').innerText = `${prog}%`;
            document.getElementById('prog-actual-bar').style.width = `${prog}%`;
        }
        renderStats(); // Re-render stats with new project data
    });
}

function setupKasListener() {
    // Jika ada listener lama, hentikan dulu untuk mencegah duplikasi
    if (kasListenerUnsubscribe) {
        kasListenerUnsubscribe();
    }

    // Mulai mendengarkan perubahan data kas secara real-time
    kasListenerUnsubscribe = listenToKasByProjectId(currentProjectId, (updatedKasList, error) => {
        if (error) {
            console.error("Gagal mendapatkan update data kas secara real-time.", error);
            Swal.fire('Error', 'Koneksi ke server data real-time gagal.', 'error');
            return;
        }
        
        kasList = updatedKasList; // Perbarui daftar transaksi global
        
        // Render ulang semua komponen yang bergantung pada data kas
        renderStats();
        renderSignatureBlock();
        renderTables();
    });
}

window.addEventListener('beforeunload', () => {
    if (kasListenerUnsubscribe) kasListenerUnsubscribe();
    if (projectListenerUnsubscribe) projectListenerUnsubscribe();
});

function renderStats() {
    const categorySummary = {};
    if (!currentProject) return; // Guard clause if project data hasn't loaded
    const fixedCategories = {
        'A': 'Material',
        'B': 'Upah',
        'C': 'Operasional'
    };

    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let saldoAwal = 0; // Default

    kasList.forEach(k => {
        if (k.tipe === 'Pemasukan') {
            totalPemasukan += k.nominal || 0;
        } else if (k.tipe === 'Pengeluaran') {
            totalPengeluaran += k.nominal || 0;
            const nom = k.nominal || 0;
            const kode = (k.kode || 'D').trim().toUpperCase(); // Default to 'D' for Lain-lain

            if (!categorySummary[kode]) {
                categorySummary[kode] = {
                    total: 0,
                    name: fixedCategories[kode] || k.kategori || (kode === 'D' ? 'Lain-lain' : `Kategori ${kode}`),
                };
            }
            categorySummary[kode].total += nom;
        }
    });

    totalActualPengeluaran = Object.values(categorySummary).reduce((sum, cat) => sum + cat.total, 0);

    const saldoAkhir = saldoAwal + totalPemasukan - totalPengeluaran;

    if(document.getElementById('stat-saldo-awal')) document.getElementById('stat-saldo-awal').innerText = formatRp(saldoAwal);
    if(document.getElementById('stat-dana-masuk')) document.getElementById('stat-dana-masuk').innerText = formatRp(totalPemasukan);
    if(document.getElementById('stat-pengeluaran')) document.getElementById('stat-pengeluaran').innerText = formatRp(totalPengeluaran);
    if(document.getElementById('stat-saldo-akhir')) document.getElementById('stat-saldo-akhir').innerText = formatRp(saldoAkhir);

    // --- START: NEW LAYOUT INJECTION ---
    const statsGrid = document.getElementById('stat-saldo-awal')?.parentElement?.parentElement;
    if (statsGrid) {
        let reportContainer = statsGrid.nextElementSibling;
        if (reportContainer && reportContainer.querySelector('#filter-search-kas')) {
            reportContainer = reportContainer.nextElementSibling;
        }

        if (reportContainer) {
            reportContainer.className = 'grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6';
            reportContainer.innerHTML = `
                <!-- Left Panel -->
                <div class="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-6">
                    <!-- Resume Actual Table -->
                    <div class="flex-1">
                        <h3 class="font-bold text-slate-800 dark:text-white mb-4">Resume Actual</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm" id="resume-actual-table">
                                <thead class="text-xs text-slate-500 uppercase">
                                    <tr>
                                        <th class="pb-2 text-left font-semibold">Kode</th>
                                        <th class="pb-2 text-left font-semibold">Kategori</th>
                                        <th class="pb-2 text-right font-semibold">Total</th>
                                        <th class="pb-2 text-right font-semibold">RAP</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                                <tfoot class="font-bold border-t-2 border-slate-200 dark:border-slate-700"></tfoot>
                            </table>
                        </div>
                    </div>
                    <!-- Pie Chart Actual -->
                    <div class="w-full">
                        <h3 class="font-bold text-slate-800 dark:text-white mb-4 text-center">Pengeluaran per Kategori</h3>
                        <div class="relative h-48 mx-auto"><canvas id="pieRealisasi"></canvas></div>
                        <div id="legendRealisasi" class="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-4 text-xs"></div>
                    </div>
                </div>

                <!-- Right Panel -->
                <div class="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-6">
                    <!-- Resume Rencana Table -->
                    <div class="flex-1">
                        <h3 class="font-bold text-slate-800 dark:text-white mb-4">Resume Rencana</h3>
                        <table class="w-full text-sm" id="resume-rencana-table">
                            <thead>
                                <tr class="text-xs text-slate-500 uppercase">
                                    <th class="pb-2 text-left font-semibold">Kategori</th>
                                    <th class="pb-2 text-right font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                        <div class="mt-4">
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Note</label>
                            <textarea id="note-rencana" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs" rows="3" placeholder="Catatan..."></textarea>
                        </div>
                    </div>
                    <!-- Pie Chart Rencana -->
                    <div class="w-full">
                        <h3 class="font-bold text-slate-800 dark:text-white mb-4 text-center">Perbandingan</h3>
                        <div class="relative h-48 mx-auto"><canvas id="piePerbandingan"></canvas></div>
                        <div id="legendPerbandingan" class="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-4 text-xs"></div>
                    </div>
                </div>
            `;
        }
    }

    const resumeActualBody = document.querySelector('#resume-actual-table tbody');
    const resumeActualFoot = document.querySelector('#resume-actual-table tfoot');
    if (resumeActualBody && resumeActualFoot) {
        const sortedCodes = Object.keys(categorySummary).sort((a, b) => {
            const isFixedA = !!fixedCategories[a];
            const isFixedB = !!fixedCategories[b];
            
            if (isFixedA && !isFixedB) return -1;
            if (!isFixedA && isFixedB) return 1;
            
            return a.localeCompare(b, undefined, { numeric: true });
        });

        let tableHtml = '';
        if (sortedCodes.length > 0) {
            tableHtml = sortedCodes.map(code => {
                const cat = categorySummary[code];
                return `
                    <tr class="border-b border-slate-100 dark:border-slate-700/50">
                        <td class="py-2 text-slate-600 dark:text-slate-400">${code}</td>
                        <td class="py-2 text-slate-800 dark:text-slate-200">${cat.name}</td>
                        <td class="py-2 text-right text-slate-800 dark:text-slate-200">${formatRp(cat.total)}</td>
                        <td class="py-2 text-right text-slate-500 dark:text-slate-400"><input type="text" data-code="${code}" class="w-24 bg-transparent text-right outline-none focus:ring-1 focus:ring-blue-500 rounded p-1" value="${currentProject.reportData?.rap?.[code] || 0}" onkeyup="window.formatRupiahInput(this)" placeholder="0"></td>
                    </tr>
                `;
            }).join('');
        } else {
            tableHtml = `<tr><td colspan="4" class="py-4 text-center text-slate-500 italic">Belum ada data pengeluaran.</td></tr>`;
        }
        
        resumeActualBody.innerHTML = tableHtml;
        // Hitung total RAP dari semua input yang sudah terisi
        let initialTotalRap = 0;
        document.querySelectorAll('#resume-actual-table tbody input[data-code]').forEach(inp => {
            initialTotalRap += parseInt(inp.value.replace(/\D/g, '')) || 0;
        });
        resumeActualFoot.innerHTML = `<tr><td colspan="2" class="py-2 text-left text-slate-800 dark:text-white">TOTAL</td><td class="py-2 text-right text-slate-800 dark:text-white">${formatRp(totalActualPengeluaran)}</td><td class="py-2 text-right text-slate-800 dark:text-white font-semibold" id="total-rap-actual">${formatRp(initialTotalRap)}</td></tr>`;
        document.querySelectorAll('#resume-actual-table input').forEach(input => {
            input.addEventListener('change', () => {
                let totalRapActual = 0;
                document.querySelectorAll('#resume-actual-table tbody input[data-code]').forEach(inp => { totalRapActual += parseInt(inp.value.replace(/\D/g, '')) || 0; });
                document.getElementById('total-rap-actual').innerText = formatRp(totalRapActual);
                // Update TOTAL RAP display
                const displayTotalRap = document.getElementById('display-total-rap');
                if (displayTotalRap) {
                    displayTotalRap.innerText = totalRapActual.toLocaleString('id-ID', {style: 'currency', currency: 'IDR', maximumFractionDigits: 0});
                }
                // Update Sisa Rencana (Total RAP - Actual Pengeluaran)
                const sisaRencana = totalRapActual - totalActualPengeluaran;
                const isMinus = sisaRencana < 0;
                const displaySisa = document.getElementById('display-sisa-rencana');
                if (displaySisa) {
                    displaySisa.innerText = (isMinus ? '-' : '') + Math.abs(sisaRencana).toLocaleString('id-ID', {style: 'currency', currency: 'IDR', maximumFractionDigits: 0});
                    displaySisa.className = 'py-2 text-right font-bold ' + (isMinus ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400');
                }
                // Update chart
                updateChartComparison();
                // Auto-save ke Firebase (debounced)
                autoSaveRapData();
            });
            // Update real-time saat user mengetik
            input.addEventListener('input', () => {
                let totalRapActual = 0;
                document.querySelectorAll('#resume-actual-table tbody input[data-code]').forEach(inp => { totalRapActual += parseInt(inp.value.replace(/\D/g, '')) || 0; });
                // Update TOTAL RAP display
                const displayTotalRap = document.getElementById('display-total-rap');
                if (displayTotalRap) {
                    displayTotalRap.innerText = totalRapActual.toLocaleString('id-ID', {style: 'currency', currency: 'IDR', maximumFractionDigits: 0});
                }
                // Update Sisa Rencana
                const sisaRencana = totalRapActual - totalActualPengeluaran;
                const isMinus = sisaRencana < 0;
                const displaySisa = document.getElementById('display-sisa-rencana');
                if (displaySisa) {
                    displaySisa.innerText = (isMinus ? '-' : '') + Math.abs(sisaRencana).toLocaleString('id-ID', {style: 'currency', currency: 'IDR', maximumFractionDigits: 0});
                    displaySisa.className = 'py-2 text-right font-bold ' + (isMinus ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400');
                }
            });
        });
    }

    const resumeRencanaBody = document.querySelector('#resume-rencana-table tbody');
    // Fungsi helper untuk menghitung total RAP dari input fields (real-time)
    window.getTotalRapFromInputs = function() {
        let total = 0;
        const inputs = document.querySelectorAll('#resume-actual-table tbody input[data-code]');
        if (!inputs || inputs.length === 0) {
            // Fallback: Ambil dari stored rap data
            if (currentProject && currentProject.reportData && currentProject.reportData.rap) {
                Object.values(currentProject.reportData.rap).forEach(v => {
                    total += parseInt(v) || 0;
                });
            }
            return total;
        }
        inputs.forEach(inp => {
            total += parseInt(inp.value.replace(/\D/g, '')) || 0;
        });
        return total;
    };
    const totalRapValue = window.getTotalRapFromInputs(); // Total RAP dari input
    const sisaRencana = totalRapValue - totalActualPengeluaran;
    const isMinus = sisaRencana < 0;

    if (resumeRencanaBody) {
        resumeRencanaBody.innerHTML = `
            <tr class="border-b border-slate-100 dark:border-slate-700/50">
                <td class="py-2 text-slate-800 dark:text-slate-200">TOTAL RAP</td>
                <td class="py-2 text-right text-slate-800 dark:text-slate-200 font-semibold" id="display-total-rap">${totalRapValue.toLocaleString('id-ID', {style: 'currency', currency: 'IDR', maximumFractionDigits: 0})}</td>
            </tr>
            <tr class="border-b border-slate-100 dark:border-slate-700/50">
                <td class="py-2 text-slate-800 dark:text-slate-200">Actual Pengeluaran</td>
                <td class="py-2 text-right text-red-500 font-semibold">${formatRp(totalActualPengeluaran)}</td>
            </tr>
            <tr class="border-b border-slate-100 dark:border-slate-700/50">
                <td class="py-2 text-slate-800 dark:text-slate-200">Sisa Rencana</td>
                <td class="py-2 text-right font-bold ${isMinus ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}" id="display-sisa-rencana">${isMinus ? '-' : ''}${Math.abs(sisaRencana).toLocaleString('id-ID', {style: 'currency', currency: 'IDR', maximumFractionDigits: 0})}</td>
            </tr>`;
    }

    // Aggregate data for summary pie chart
    let pieData = { material: 0, upah: 0, operasional: 0, lainLain: 0 };
    Object.keys(categorySummary).forEach(code => {
        const total = categorySummary[code].total;
        if (code === 'A') {
            pieData.material += total;
        } else if (code === 'B') {
            pieData.upah += total;
        } else if (code.startsWith('C')) {
            pieData.operasional += total;
        } else {
            pieData.lainLain += total;
        }
    });

    renderCharts({
        A: pieData.material, B: pieData.upah,
        C: pieData.operasional, D: pieData.lainLain,
        E: 0 // E is deprecated based on new request
    });
}

window.customFilterTransactions = function(query) {
    currentSearchQuery = query;
    currentPage = 1; // Reset to first page when filtering
    renderTables();
};

function getFilteredKas() {
    let list = [...kasList];
    if (currentSearchQuery.trim() !== '') {
        const q = currentSearchQuery.toLowerCase();
        list = list.filter(k => 
            (k.uraian && String(k.uraian).toLowerCase().includes(q)) ||
            (k.keterangan && String(k.keterangan).toLowerCase().includes(q)) ||
            (k.kategori && String(k.kategori).toLowerCase().includes(q)) ||
            (k.pic && String(k.pic).toLowerCase().includes(q))
        );
    }
    return list;
}

function renderTables() {
    const tableBody = document.getElementById('table-kas-gabungan-body');
    if(!tableBody) return;

    let displayList = getFilteredKas();

    // Urutkan berdasarkan tanggal
    displayList.sort((a, b) => {
        if (!a.tanggal || !b.tanggal) return 0;
        return new Date(a.tanggal) - new Date(b.tanggal);
    });

    // Reset to first page when filtering
    const totalItems = displayList.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage > totalPages) {
        currentPage = Math.max(1, totalPages);
    }

    // Get items for current page
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const pageItems = displayList.slice(startIdx, endIdx);

    let html = '';
    let no = startIdx + 1;
    let saldo = 0;

    // Calculate saldo starting point (sum of all previous pages)
    for (let i = 0; i < startIdx; i++) {
        if (displayList[i].tipe === 'Pemasukan') {
            saldo += displayList[i].nominal || 0;
        } else {
            saldo -= displayList[i].nominal || 0;
        }
    }

    pageItems.forEach(k => {
        const dateFmt = k.tanggal ? new Date(k.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
        const actions = userRole !== 'Viewer' ? `
            <div class="flex items-center justify-center gap-2">
                <button onclick="openEditKasModal('${k.id}')" class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors" title="Edit">
                    <i class="fas fa-edit text-sm"></i>
                </button>
                <button onclick="deleteKasItem('${k.id}')" class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 transition-colors" title="Hapus">
                    <i class="fas fa-trash text-sm"></i>
                </button>
            </div>
        ` : '<span class="text-slate-400 text-xs">View only</span>';

        let kode = k.kode || '-';
        let deskripsi = '';
        let user = '';
        let debit = '-';
        let kredit = '-';
        let keterangan = '';

        if (k.tipe === 'Pengeluaran') {
            kode = k.kode || '-';
            deskripsi = k.kategori ? `${k.kategori} - ${k.uraian || ''}` : (k.uraian || '-');
            user = k.pic || '-';
            kredit = formatRp(k.nominal);
            saldo -= k.nominal;
            keterangan = k.keterangan || '-';
        } else {
            kode = 'M-' + (k.kode || '');
            deskripsi = k.uraian || '-';
            user = k.sumberDana || 'Pusat';
            debit = formatRp(k.nominal);
            saldo += k.nominal;
            keterangan = k.keterangan || 'Verified';
        }

        html += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group" data-kas-id="${k.id}">
                <td class="p-3 text-center no-print">
                    <input type="checkbox" class="kas-checkbox w-4 h-4 rounded cursor-pointer" data-id="${k.id}" onchange="updateCheckboxState()">
                </td>
                <td class="p-3 text-center text-slate-600 dark:text-slate-400">${no}</td>
                <td class="p-3 font-bold text-slate-700 dark:text-slate-300">${kode}</td>
                <td class="p-3 text-slate-800 dark:text-slate-200">${deskripsi}</td>
                <td class="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">${dateFmt}</td>
                <td class="p-3 text-slate-600 dark:text-slate-400">${user}</td>
                <td class="p-3 text-right font-semibold text-green-500">${debit}</td>
                <td class="p-3 text-right font-semibold text-red-500">${kredit}</td>
                <td class="p-3 text-right font-semibold ${saldo >= 0 ? 'text-green-500' : 'text-red-500'}">${formatRp(saldo)}</td>
                <td class="p-3 text-slate-600 dark:text-slate-400">${keterangan}</td>
                <td class="p-3 text-center whitespace-nowrap no-print">${actions}</td>
            </tr>
        `;
        no++;
    });

    if (html === '') html = '<tr><td colspan="11" class="p-6 text-center text-slate-500 italic">Tidak ada transaksi.</td></tr>';

    tableBody.innerHTML = html;
    
    // Update pagination controls
    updatePaginationControls(totalPages, totalItems);
    
    // Reset checkbox state ketika tabel di-render ulang
    clearAllCheckboxes();
}

window.formatRupiahInput = function(input) {
    let val = input.value.replace(/\D/g, '');
    if (val === '') {
        input.value = '';
        return;
    }
    input.value = parseInt(val).toLocaleString('id-ID');
};

// Pagination functions
window.updatePaginationControls = function(totalPages, totalItems) {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;

    if (totalItems <= itemsPerPage) {
        // Hide pagination if items are less than or equal to items per page
        paginationContainer.classList.add('hidden');
        return;
    }

    paginationContainer.classList.remove('hidden');
    
    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');
    const pageInfo = document.getElementById('pagination-info');
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
    if (pageInfo) pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
};

window.goToPrevPage = function() {
    if (currentPage > 1) {
        currentPage--;
        renderTables();
        // Scroll to table
        document.getElementById('tab-kas-gabungan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.goToNextPage = function() {
    let displayList = getFilteredKas();
    const totalPages = Math.ceil(displayList.length / itemsPerPage);
    
    if (currentPage < totalPages) {
        currentPage++;
        renderTables();
        // Scroll to table
        document.getElementById('tab-kas-gabungan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.updateGrafikPerbandingan = function() {
    renderStats(); 
}

window.handleKodeChange = function(kode) {
    const kategoriInput = document.getElementById('swal-k-kategori');
    if (!kategoriInput) return;

    const fixedCategories = {
        'A': 'Material',
        'B': 'Upah',
        'C': 'Operasional'
    };

    const upperKode = (kode || '').trim().toUpperCase();

    if (fixedCategories[upperKode]) {
        kategoriInput.value = fixedCategories[upperKode];
        kategoriInput.readOnly = true;
        kategoriInput.classList.add('bg-slate-100', 'dark:bg-slate-800', 'cursor-not-allowed');
    } else {
        if (kategoriInput.readOnly) kategoriInput.value = '';
        kategoriInput.readOnly = false;
        kategoriInput.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'cursor-not-allowed');
    }
}

// Fungsi untuk update chart comparison saja (tanpa rebuild HTML)
window.updateChartComparison = function() {
    if (typeof Chart === 'undefined') return;
    const ctxPerb = document.getElementById('piePerbandingan');
    if (!ctxPerb) return;

    if (perbandinganChartInst) perbandinganChartInst.destroy();

    // Hitung Sisa Rencana = Total RAP - Actual Pengeluaran
    const valTotalRap = window.getTotalRapFromInputs ? window.getTotalRapFromInputs() : 0;
    const valSisaRencana = valTotalRap - totalActualPengeluaran;

    const labels = ['Sisa Rencana', 'Actual Pengeluaran'];
    const dataVals = [valSisaRencana, totalActualPengeluaran];
    const colors = ['#22c55e', '#ef4444']; // Hijau untuk sisa, Merah untuk actual

    perbandinganChartInst = new Chart(ctxPerb, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataVals,
                backgroundColor: colors,
                borderWidth: 1,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '50%',
            layout: { padding: 10 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    callbacks: { label: function(context) { return context.label + ': ' + formatRp(context.raw); } }
                }
            }
        }
    });

    // Update legend
    const totalData = dataVals.reduce((a, b) => a + b, 0);
    let legendHtml = '';
    labels.forEach((label, idx) => {
        const pct = totalData > 0 ? Math.round((dataVals[idx] / totalData) * 100) : 0;
        legendHtml += `<div class="flex items-center gap-1"><span class="w-3 h-3 rounded-full" style="background:${colors[idx]}"></span><span class="text-slate-600 dark:text-slate-400">${label}: ${pct}%</span></div>`;
    });
    if (document.getElementById('legendPerbandingan')) {
        document.getElementById('legendPerbandingan').innerHTML = legendHtml;
    }
};

function renderCharts(resumeData = null) {
    if(typeof Chart === 'undefined') return;

    if (!resumeData) {
        // Fallback panggil ulang jika dipicu toggle theme
        renderStats();
        return;
    }

    const textColor = '#000000';

    const customPieDatalabels = {
        id: 'customPieDatalabels',
        afterDraw: (chart) => {
            const ctx = chart.ctx;
            chart.data.datasets.forEach((dataset, i) => {
                const meta = chart.getDatasetMeta(i);
                if (meta.type !== 'pie' && meta.type !== 'doughnut') return;
                
                let total = dataset.data.reduce((a, b) => a + b, 0);
                if (total === 0) return;

                meta.data.forEach((element, index) => {
                    const value = dataset.data[index];
                    if (value === 0) return;
                    
                    const percent = ((value / total) * 100).toFixed(1) + '%';
                    const position = element.tooltipPosition();
                    
                    ctx.save();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 10px Calibri, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowColor = 'rgba(0,0,0,0.9)';
                    ctx.shadowBlur = 3;
                    ctx.fillText(percent, position.x, position.y);
                    ctx.restore();
                });
            });
        }
    };

    // 1. Chart Realisasi Actual (Pie)
    const ctxReal = document.getElementById('pieRealisasi');
    if (ctxReal) {
        if (realisasiChartInst) realisasiChartInst.destroy();
        // Material=Biru Tua, Upah=Kuning, Operasional=Biru Muda, Lain-lain=Ungu, Belanja HO=Hijau
        const labels = ['Material', 'Upah', 'Operasional', 'Lain-lain'];
        const dataVals = [resumeData.A, resumeData.B, resumeData.C, resumeData.D];
        const colors = ['#1e3a8a', '#facc15', '#38bdf8', '#a855f7'];

        realisasiChartInst = new Chart(ctxReal, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: dataVals,
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: 8 },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true, callbacks: { label: function(context) { return context.label + ': ' + formatRp(context.raw); } } }
                }
            },
            plugins: [customPieDatalabels]
        });

        // Custom HTML Legend render
        const totalData = dataVals.reduce((a, b) => a + b, 0);
        let legendHtml = '';
        labels.forEach((lb, idx) => {
            if (dataVals[idx] > 0) {
                const pct = ((dataVals[idx] / totalData) * 100).toFixed(1);
                legendHtml += `<div class="flex items-center gap-1.5 justify-center"><span class="w-3 h-3 block border border-slate-300 dark:border-slate-600 rounded-sm" style="background:${colors[idx]}"></span><span class="font-semibold text-slate-600 dark:text-slate-300">${lb} (${pct}%)</span></div>`;
            }
        });
        document.getElementById('legendRealisasi').innerHTML = legendHtml;
    }

    // 2. Chart Perbandingan (Donut) COGS vs Actual
    const ctxPerb = document.getElementById('piePerbandingan');
    if (ctxPerb) {
        if (perbandinganChartInst) perbandinganChartInst.destroy();

        // Hitung Sisa Rencana = Total RAP - Actual Pengeluaran
        const valTotalRap = window.getTotalRapFromInputs ? window.getTotalRapFromInputs() : 0;
        const valSisaRencana = valTotalRap - totalActualPengeluaran;

        const labels = ['Sisa Rencana', 'Actual Pengeluaran'];
        const dataVals = [valSisaRencana, totalActualPengeluaran];
        const colors = ['#22c55e', '#ef4444']; // Hijau untuk sisa, Merah untuk actual

        perbandinganChartInst = new Chart(ctxPerb, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataVals,
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '50%',
                layout: { padding: 10 },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true, callbacks: { label: function(context) { return context.label + ': ' + formatRp(context.raw); } } }
                }
            },
            plugins: [customPieDatalabels]
        });

        // Custom HTML Legend render
        const totalData = dataVals.reduce((a, b) => a + b, 0);
        let legendHtml = '';
        labels.forEach((lb, idx) => {
            const pct = totalData > 0 ? ((dataVals[idx]/totalData)*100).toFixed(1) : 0;
            legendHtml += `<div class="flex items-center gap-1.5 justify-center"><span class="w-3 h-3 block border border-slate-300 dark:border-slate-600 rounded-sm" style="background:${colors[idx]}"></span><span class="font-semibold text-slate-600 dark:text-slate-300">${lb} (${pct}%)</span></div>`;
        });
        document.getElementById('legendPerbandingan').innerHTML = legendHtml;
    }
}

// Event listener untuk resize window agar chart responsif
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        // Update chart jika ada data
        if (typeof updateChartComparison === 'function') {
            updateChartComparison();
        }
    }, 100);
});

function showKasModal(title, kas = {}, onConfirm) {
    const isDark = document.documentElement.classList.contains('dark');
    const isKeluar = kas.tipe === 'Pengeluaran' || !kas.tipe;
    
    Swal.fire({
        title: title,
        background: isDark ? '#1e293b' : '#ffffff', 
        color: isDark ? '#f8fafc' : '#0f172a',
        width: '600px',
        html: `
            <div class="space-y-4 text-left mt-2">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Tipe Transaksi</label>
                        <select id="swal-k-tipe" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" onchange="toggleFormKas(this.value)">
                            <option value="Pengeluaran" ${kas.tipe === 'Pengeluaran' ? 'selected' : ''}>Kas Keluar</option>
                            <option value="Pemasukan" ${kas.tipe === 'Pemasukan' ? 'selected' : ''}>Kas Masuk</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Tanggal</label>
                        <input id="swal-k-tanggal" type="date" value="${kas.tanggal || new Date().toISOString().split('T')[0]}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500">
                    </div>
                </div>
                
                <div id="form-keluar" style="display: ${isKeluar ? 'block' : 'none'}">
                    <div class="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Kode</label>
                            <input id="swal-k-kode" value="${kas.kode || ''}" onchange="window.handleKodeChange(this.value)" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" placeholder="A, B, C, C1, dll">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Kategori</label>
                            <input id="swal-k-kategori" value="${kas.kategori || ''}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" placeholder="Otomatis untuk A, B, C">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">User</label>
                            <input id="swal-k-pic" value="${kas.pic || ''}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" placeholder="Nama penerima dana">
                        </div>
                    </div>
                </div>
                
                <div id="form-masuk" style="display: ${!isKeluar ? 'block' : 'none'}">
                    <div class="mb-4">
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Sumber Dana</label>
                        <input id="swal-k-sumber" value="${kas.sumberDana || ''}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" placeholder="Pusat / Klien / Investor">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Deskripsi</label>
                    <input id="swal-k-uraian" value="${kas.uraian || ''}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" placeholder="Beli semen 100 sak...">
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Nominal (Rp)</label>
                    <input id="swal-k-nominal" type="text" value="${kas.nominal ? kas.nominal.toLocaleString('id-ID') : ''}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 font-bold text-lg" placeholder="1.500.000" onkeyup="window.formatRupiahInput(this)">
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Keterangan Tambahan</label>
                    <textarea id="swal-k-keterangan" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 resize-none" rows="2" placeholder="Catatan invoice/nota...">${kas.keterangan || ''}</textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#FF7A00',
        cancelButtonColor: isDark ? '#334155' : '#94a3b8',
        confirmButtonText: 'Simpan Data',
        didOpen: () => {
            window.handleKodeChange(document.getElementById('swal-k-kode')?.value);
        },
        preConfirm: () => {
            const tipe = document.getElementById('swal-k-tipe').value;
            const tanggal = document.getElementById('swal-k-tanggal').value;
            const uraian = document.getElementById('swal-k-uraian').value;
            const nominalRaw = document.getElementById('swal-k-nominal').value;
            const nominal = parseFloat(nominalRaw.replace(/\D/g, '')) || 0;
            const keterangan = document.getElementById('swal-k-keterangan').value;
            
            const kode = document.getElementById('swal-k-kode').value.trim().toUpperCase();
            const kategori = document.getElementById('swal-k-kategori').value;
            const pic = document.getElementById('swal-k-pic').value;
            const sumberDana = document.getElementById('swal-k-sumber').value;

            if(!tanggal || !uraian || nominal <= 0) { 
                Swal.showValidationMessage('Tanggal, Uraian, dan Nominal valid wajib diisi!'); 
                return false; 
            }
            
            const payload = { 
                projectId: String(currentProjectId || ''), 
                tanggal: String(tanggal || ''), 
                uraian: String(uraian || ''), 
                tipe: String(tipe || 'Pengeluaran'), 
                nominal: Number(nominal), 
                keterangan: String(keterangan || ''), 
                kode: tipe === 'Pengeluaran' ? String(kode || '') : '',
                kategori: tipe === 'Pengeluaran' ? String(kategori || '') : '',
                pic: tipe === 'Pengeluaran' ? String(pic || '') : '',
                sumberDana: tipe === 'Pemasukan' ? String(sumberDana || '') : '',
                timestamp: Date.now()
            };
            
            // Sanitasi payload: pastikan tidak ada object yang undefined
            Object.keys(payload).forEach(key => { if (payload[key] === undefined) delete payload[key]; });
            
            return payload;
        }
    }).then(onConfirm);
}

window.toggleFormKas = function(tipe) {
    if(tipe === 'Pengeluaran') {
        document.getElementById('form-keluar').style.display = 'block';
        document.getElementById('form-masuk').style.display = 'none';
    } else {
        document.getElementById('form-keluar').style.display = 'none';
        document.getElementById('form-masuk').style.display = 'block';
    }
}

window.openAddKasModal = function() {
    showKasModal('Transaksi Baru', {}, async (result) => {
        if (result.isConfirmed) {
            const isDark = document.documentElement.classList.contains('dark');
            Swal.fire({ title: 'Menyimpan...', background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            try {
                const res = await addKas(result.value);
                Swal.fire('Berhasil', 'Transaksi berhasil ditambahkan.', 'success');
            } catch (error) {
                console.error("Gagal menambahkan transaksi kas:", error);
                // Menampilkan pesan error yang lebih spesifik dari Firebase
                const errorMessage = error.code === 'permission-denied' ? 'Akses ditolak. Periksa Firebase Security Rules Anda.' : (error.message || 'Terjadi kesalahan yang tidak diketahui.');
                Swal.fire({ icon: 'error', title: 'Gagal', text: `Terjadi kesalahan: ${errorMessage}`, background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a' });
            }
        }
    });
}

window.openEditKasModal = function(id) {
    const kas = kasList.find(k => k.id === id);
    if (!kas) return;

    showKasModal('Edit Transaksi', kas, async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Mengupdate...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const res = await updateKas(id, result.value);
            if (res) {
                Swal.fire('Berhasil', 'Transaksi berhasil diperbarui.', 'success');
            } else {
                Swal.fire('Gagal', 'Terjadi kesalahan server.', 'error');
            }
        }
    });
}

window.deleteKasItem = function(id) {
    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
        title: 'Hapus Transaksi?',
        text: "Data yang dihapus akan mempengaruhi total saldo.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: isDark ? '#334155' : '#94a3b8',
        confirmButtonText: 'Ya, Hapus',
        background: isDark ? '#1e293b' : '#ffffff', 
        color: isDark ? '#f8fafc' : '#0f172a'
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const res = await deleteKas(id);
            if (res) {
                Swal.fire('Terhapus', 'Transaksi berhasil dihapus.', 'success');
            } else {
                Swal.fire('Gagal', 'Gagal menghapus data dari database.', 'error');
            }
        }
    });
};

// Checkbox Management Functions
window.updateCheckboxState = function() {
    const checkboxes = document.querySelectorAll('.kas-checkbox');
    const checkedCount = document.querySelectorAll('.kas-checkbox:checked').length;
    const selectAllCheckbox = document.getElementById('checkbox-select-all');
    const bulkDeleteSection = document.getElementById('bulk-delete-section');
    const selectedCountSpan = document.getElementById('selected-count');
    
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
    }
    
    if (bulkDeleteSection) {
        if (checkedCount > 0) {
            bulkDeleteSection.classList.remove('hidden');
            selectedCountSpan.textContent = `${checkedCount} dipilih`;
        } else {
            bulkDeleteSection.classList.add('hidden');
        }
    }
};

window.toggleAllCheckboxes = function(checked) {
    document.querySelectorAll('.kas-checkbox').forEach(checkbox => {
        checkbox.checked = checked;
    });
    updateCheckboxState();
};

window.clearAllCheckboxes = function() {
    document.querySelectorAll('.kas-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    document.getElementById('checkbox-select-all').checked = false;
    document.getElementById('bulk-delete-section').classList.add('hidden');
};

window.bulkDeleteSelectedItems = function() {
    const selectedCheckboxes = document.querySelectorAll('.kas-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        Swal.fire('Info', 'Pilih minimal satu item untuk dihapus.', 'info');
        return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
        title: 'Hapus Beberapa Transaksi?',
        text: `Anda akan menghapus ${selectedCheckboxes.length} transaksi. Tindakan ini tidak dapat dibatalkan.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: isDark ? '#334155' : '#94a3b8',
        confirmButtonText: 'Ya, Hapus Semua',
        cancelButtonText: 'Batal',
        background: isDark ? '#1e293b' : '#ffffff', 
        color: isDark ? '#f8fafc' : '#0f172a'
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ 
                title: 'Menghapus...', 
                allowOutsideClick: false, 
                didOpen: () => Swal.showLoading() 
            });

            let successCount = 0;
            let failedCount = 0;
            const ids = Array.from(selectedCheckboxes).map(cb => cb.dataset.id);

            for (const id of ids) {
                try {
                    const res = await deleteKas(id);
                    if (res) {
                        successCount++;
                    } else {
                        failedCount++;
                    }
                } catch (error) {
                    failedCount++;
                }
            }

            if (failedCount === 0) {
                Swal.fire('Berhasil', `${successCount} transaksi berhasil dihapus.`, 'success');
                clearAllCheckboxes();
            } else {
                Swal.fire('Sebagian Berhasil', `${successCount} berhasil dihapus, ${failedCount} gagal.`, 'warning');
                clearAllCheckboxes();
            }
        }
    });
};

window.exportToExcel = function() {
    let exportList = getFilteredKas();
    if (exportList.length === 0) {
        Swal.fire('Info', 'Tidak ada data untuk diekspor.', 'info');
        return;
    }

    let saldoBerjalan = 0;
    const data = exportList.map((k, index) => {
        const debit = k.tipe === 'Pemasukan' ? k.nominal : 0;
        const kredit = k.tipe === 'Pengeluaran' ? k.nominal : 0;
        saldoBerjalan += (debit - kredit);
        return {
            'No': index + 1,
            'Tanggal': k.tanggal,
            'Uraian': k.uraian,
            'Pemasukan (Debit)': debit,
            'Pengeluaran (Kredit)': kredit,
            'Saldo': saldoBerjalan,
            'Keterangan': k.keterangan || ''
        };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Kas");
    
    const safeName = currentProject ? currentProject.name.replace(/[^a-z0-9]/gi, '_') : 'Proyek';
    XLSX.writeFile(wb, `Laporan_Kas_${safeName}.xlsx`);
};

window.showImportInstructions = function() {
    // Tampilkan panduan sebelum import
    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
        title: '📥 Panduan Import Excel (Data Kas)',
        width: '700px',
        background: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#f8fafc' : '#0f172a',
        html: `
            <div class="text-left text-sm mb-6 text-slate-600 dark:text-slate-300 space-y-4">
                <div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p class="font-semibold text-blue-900 dark:text-blue-200 mb-2">📋 Format File Excel</p>
                    <p class="text-xs text-blue-800 dark:text-blue-300">File Excel Anda harus memiliki baris header (judul kolom) di baris pertama. Urutan kolom tidak harus sama, sistem akan mencocokkan otomatis.</p>
                </div>

                <div>
                    <p class="font-semibold text-slate-800 dark:text-white mb-3">Kolom yang Diperlukan & Optional:</p>
                    <div class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <table class="w-full text-xs">
                            <thead class="bg-slate-200 dark:bg-slate-800">
                                <tr>
                                    <th class="p-3 text-left font-semibold">Kolom</th>
                                    <th class="p-3 text-left font-semibold">Wajib?</th>
                                    <th class="p-3 text-left font-semibold">Contoh</th>
                                    <th class="p-3 text-left font-semibold">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
                                <tr>
                                    <td class="p-3 font-semibold text-slate-700 dark:text-slate-300">Tipe</td>
                                    <td class="p-3"><span class="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs font-semibold">WAJIB</span></td>
                                    <td class="p-3">Pengeluaran / Pemasukan</td>
                                    <td class="p-3 text-slate-600 dark:text-slate-400">Jenis transaksi</td>
                                </tr>
                                <tr>
                                    <td class="p-3 font-semibold text-slate-700 dark:text-slate-300">Uraian</td>
                                    <td class="p-3"><span class="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs font-semibold">WAJIB</span></td>
                                    <td class="p-3">Pembelian Semen 100 sak</td>
                                    <td class="p-3 text-slate-600 dark:text-slate-400">Deskripsi singkat</td>
                                </tr>
                                <tr>
                                    <td class="p-3 font-semibold text-slate-700 dark:text-slate-300">Nominal</td>
                                    <td class="p-3"><span class="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs font-semibold">WAJIB</span></td>
                                    <td class="p-3">1500000 atau 1.500.000</td>
                                    <td class="p-3 text-slate-600 dark:text-slate-400">Jumlah uang (angka)</td>
                                </tr>
                                <tr class="bg-green-50 dark:bg-green-950/30">
                                    <td class="p-3 font-semibold text-slate-700 dark:text-slate-300">Tanggal</td>
                                    <td class="p-3"><span class="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-semibold">OPSIONAL</span></td>
                                    <td class="p-3">2024-05-20</td>
                                    <td class="p-3 text-slate-600 dark:text-slate-400">Jika kosong, akan pakai hari ini</td>
                                </tr>
                                <tr class="bg-green-50 dark:bg-green-950/30">
                                    <td class="p-3 font-semibold text-slate-700 dark:text-slate-300">Kode</td>
                                    <td class="p-3"><span class="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-semibold">OPSIONAL</span></td>
                                    <td class="p-3">A, B, C, C1, dll</td>
                                    <td class="p-3 text-slate-600 dark:text-slate-400">Kategori pengeluaran</td>
                                </tr>
                                <tr class="bg-green-50 dark:bg-green-950/30">
                                    <td class="p-3 font-semibold text-slate-700 dark:text-slate-300">Kategori</td>
                                    <td class="p-3"><span class="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-semibold">OPSIONAL</span></td>
                                    <td class="p-3">Material, Upah, dll</td>
                                    <td class="p-3 text-slate-600 dark:text-slate-400">Otomatis jika kode A/B/C</td>
                                </tr>
                                <tr class="bg-green-50 dark:bg-green-950/30">
                                    <td class="p-3 font-semibold text-slate-700 dark:text-slate-300">PIC / User</td>
                                    <td class="p-3"><span class="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-semibold">OPSIONAL</span></td>
                                    <td class="p-3">Budi, Ani, dll</td>
                                    <td class="p-3 text-slate-600 dark:text-slate-400">Penerima dana / PIC</td>
                                </tr>
                                <tr class="bg-green-50 dark:bg-green-950/30">
                                    <td class="p-3 font-semibold text-slate-700 dark:text-slate-300">Sumber Dana</td>
                                    <td class="p-3"><span class="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-semibold">OPSIONAL</span></td>
                                    <td class="p-3">Pusat, Klien, Investor</td>
                                    <td class="p-3 text-slate-600 dark:text-slate-400">Untuk kas masuk saja</td>
                                </tr>
                                <tr class="bg-green-50 dark:bg-green-950/30">
                                    <td class="p-3 font-semibold text-slate-700 dark:text-slate-300">Keterangan</td>
                                    <td class="p-3"><span class="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-semibold">OPSIONAL</span></td>
                                    <td class="p-3">Nota #123, Invoice</td>
                                    <td class="p-3 text-slate-600 dark:text-slate-400">Catatan tambahan</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p class="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">⚠️ Tips Penting</p>
                    <ul class="list-disc pl-5 space-y-1 text-xs text-yellow-800 dark:text-yellow-300">
                        <li>Format nominal: <code class="bg-white dark:bg-slate-900 px-1 rounded">1500000</code> atau <code class="bg-white dark:bg-slate-900 px-1 rounded">1.500.000</code></li>
                        <li>Format tipe: persis <code class="bg-white dark:bg-slate-900 px-1 rounded">Pengeluaran</code> atau <code class="bg-white dark:bg-slate-900 px-1 rounded">Pemasukan</code></li>
                        <li>Baris tanpa Tipe, Uraian, atau Nominal akan dilewati otomatis</li>
                        <li>Anda akan melihat pratinjau sebelum data diimport</li>
                    </ul>
                </div>

                <div class="flex gap-2">
                    <button onclick="downloadExcelTemplate()" class="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2">
                        <i class="fas fa-download"></i> Download Template
                    </button>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-file-upload mr-2"></i> Pilih File Excel',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#16a34a',
        cancelButtonColor: isDark ? '#334155' : '#94a3b8',
    }).then((result) => {
        if (result.isConfirmed) {
            document.getElementById('import-excel-file').click();
        }
    });
};

window.downloadExcelTemplate = function() {
    const templateData = [
        { 'Tanggal': '2024-05-20', 'Tipe': 'Pengeluaran', 'Uraian': 'Pembelian Semen 100 Sak', 'Nominal': 1500000, 'Kode': 'A', 'Kategori': 'Material', 'PIC': 'Budi', 'Sumber Dana': '', 'Keterangan': 'Nota 123' },
        { 'Tanggal': '2024-05-20', 'Tipe': 'Pengeluaran', 'Uraian': 'Upah Tukang Hari', 'Nominal': 750000, 'Kode': 'B', 'Kategori': 'Upah', 'PIC': 'Ani', 'Sumber Dana': '', 'Keterangan': 'Untuk 10 orang' },
        { 'Tanggal': '2024-05-21', 'Tipe': 'Pengeluaran', 'Uraian': 'Sewa Alat Berat', 'Nominal': 2000000, 'Kode': 'C', 'Kategori': 'Operasional', 'PIC': 'Joko', 'Sumber Dana': '', 'Keterangan': 'Excavator 1 hari' },
        { 'Tanggal': '2024-05-21', 'Tipe': 'Pemasukan', 'Uraian': 'Dana Termin 1 dari Pusat', 'Nominal': 50000000, 'Kode': '', 'Kategori': '', 'PIC': '', 'Sumber Dana': 'Pusat', 'Keterangan': '' },
        { 'Tanggal': '2024-05-22', 'Tipe': 'Pemasukan', 'Uraian': 'Kontribusi dari Klien', 'Nominal': 10000000, 'Kode': '', 'Kategori': '', 'PIC': '', 'Sumber Dana': 'Klien', 'Keterangan': 'Cicilan termin 2' }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Styling untuk header (opsional tapi bagus)
    ws['!cols'] = [
        { wch: 12 }, // Tanggal
        { wch: 12 }, // Tipe
        { wch: 25 }, // Uraian
        { wch: 15 }, // Nominal
        { wch: 8 },  // Kode
        { wch: 12 }, // Kategori
        { wch: 12 }, // PIC
        { wch: 15 }, // Sumber Dana
        { wch: 20 }  // Keterangan
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Kas");
    XLSX.writeFile(wb, 'Template_Import_Kas.xlsx');
};

window.handleImportExcel = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const isDark = document.documentElement.classList.contains('dark');
    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            const json = XLSX.utils.sheet_to_json(worksheet);
            
            if (json.length === 0) {
                event.target.value = '';
                return Swal.fire({ icon: 'warning', title: 'Data Kosong', text: 'File Excel tidak berisi data.', background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a' });
            }

            let excelHeaders = Array.from(new Set(json.flatMap(row => Object.keys(row))));

            const fields = [
                { id: 'map-tanggal', label: 'Tanggal', aliases: ['tanggal', 'date'] },
                { id: 'map-tipe', label: 'Tipe Transaksi *', aliases: ['tipe', 'type', 'jenis'], required: true },
                { id: 'map-uraian', label: 'Uraian *', aliases: ['uraian', 'deskripsi', 'description', 'item'], required: true },
                { id: 'map-nominal', label: 'Nominal *', aliases: ['nominal', 'jumlah', 'harga', 'amount', 'total'], required: true },
                { id: 'map-kode', label: 'Kode', aliases: ['kode', 'code'] },
                { id: 'map-kategori', label: 'Kategori', aliases: ['kategori', 'category'] },
                { id: 'map-pic', label: 'PIC / Penerima', aliases: ['pic', 'penerima', 'person'] },
                { id: 'map-sumber', label: 'Sumber Dana', aliases: ['sumber', 'source'] },
                { id: 'map-keterangan', label: 'Keterangan', aliases: ['keterangan', 'catatan', 'note', 'desc'] }
            ];

            let mapHtml = `<div class="text-left text-sm text-slate-600 dark:text-slate-300 mb-4">Sesuaikan kolom dari file Excel Anda dengan format sistem:</div><div class="space-y-3 text-left">`;
            fields.forEach(f => {
                let options = `<option value="">-- Abaikan --</option>`;
                let matched = false;
                excelHeaders.forEach(h => {
                    let hLower = h.toLowerCase();
                    let isMatch = !matched && (f.aliases.some(a => hLower.includes(a)));
                    if (isMatch) matched = true;
                    options += `<option value="${h}" ${isMatch ? 'selected' : ''}>${h}</option>`;
                });
                mapHtml += `<div><label class="block text-xs font-semibold text-slate-800 dark:text-white mb-1">${f.label}</label><select id="${f.id}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 outline-none text-sm">${options}</select></div>`;
            });
            mapHtml += `</div>`;

            const mappingResult = await Swal.fire({ title: 'Pemetaan Kolom Excel', html: mapHtml, background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a', showCancelButton: true, confirmButtonColor: '#16a34a', confirmButtonText: 'Lanjut Pratinjau', preConfirm: () => {
                const mapped = {};
                let missing = [];
                fields.forEach(f => {
                    const val = document.getElementById(f.id).value;
                    if (f.required && !val) {
                        missing.push(f.label.replace(' *', ''));
                    }
                    mapped[f.id] = val;
                });
                if (missing.length > 0) {
                    Swal.showValidationMessage(`Kolom wajib dipetakan: ${missing.join(', ')}`);
                    return false;
                }
                return mapped;
            } });
            if (!mappingResult.isConfirmed) { event.target.value = ''; return; }
            const mappings = mappingResult.value;

            const parsedData = json.map(row => {
                const tipeRaw = mappings['map-tipe'] ? String(row[mappings['map-tipe']] || '').toLowerCase() : '';
                const uraian = mappings['map-uraian'] ? row[mappings['map-uraian']] : '';
                const nominal = mappings['map-nominal'] ? parseFloat(String(row[mappings['map-nominal']]).replace(/[^0-9,]/g, '').replace(',', '.')) || 0 : 0;
                if (!tipeRaw || !uraian || nominal <= 0) return null;

                let tanggal = new Date();
                if (mappings['map-tanggal'] && row[mappings['map-tanggal']]) {
                    const dateVal = row[mappings['map-tanggal']];
                    if (dateVal instanceof Date) tanggal = dateVal;
                }

                return {
                    projectId: currentProjectId,
                    tanggal: tanggal.toISOString().split('T')[0],
                    tipe: (tipeRaw.includes('masuk') || tipeRaw.includes('debit')) ? 'Pemasukan' : 'Pengeluaran',
                    uraian: String(uraian),
                    nominal: nominal,
                    kode: mappings['map-kode'] ? String(row[mappings['map-kode']] || '') : '',
                    kategori: mappings['map-kategori'] ? String(row[mappings['map-kategori']] || '') : '',
                    pic: mappings['map-pic'] ? String(row[mappings['map-pic']] || '') : '',
                    sumberDana: mappings['map-sumber'] ? String(row[mappings['map-sumber']] || '') : '',
                    keterangan: mappings['map-keterangan'] ? String(row[mappings['map-keterangan']] || '') : '',
                    timestamp: Date.now()
                };
            }).filter(Boolean);

            if (parsedData.length === 0) { event.target.value = ''; return Swal.fire({ icon: 'warning', title: 'Data Tidak Valid', text: 'Tidak ada baris data yang valid.', background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a' }); }

            let previewHtml = `
                <div class="text-left mb-4">
                    <p class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">✓ Ditemukan <span class="text-green-600 dark:text-green-400">${parsedData.length}</span> baris data valid</p>
                    <p class="text-xs text-slate-600 dark:text-slate-300 mb-3">Pratinjau data yang akan diimport (maksimal 10 baris pertama):</p>
                </div>
                <div class="max-h-72 overflow-auto text-left border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900">
                    <table class="w-full">
                        <thead class="sticky top-0 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-850 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th class="p-3 text-center text-xs font-bold text-slate-600 dark:text-slate-300">NO</th>
                                <th class="p-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300">KODE</th>
                                <th class="p-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300">DESKRIPSI</th>
                                <th class="p-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">TANGGAL</th>
                                <th class="p-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300">USER</th>
                                <th class="p-3 text-right text-xs font-bold text-slate-600 dark:text-slate-300">DEBIT</th>
                                <th class="p-3 text-right text-xs font-bold text-slate-600 dark:text-slate-300">KREDIT</th>
                                <th class="p-3 text-right text-xs font-bold text-slate-600 dark:text-slate-300">SALDO</th>
                                <th class="p-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300">KETERANGAN</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            let saldo = 0;
            parsedData.slice(0, 10).forEach((d, idx) => {
                const dateFmt = d.tanggal ? new Date(d.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                let kode = d.kode || '-';
                let deskripsi = '';
                let user = '';
                let debit = '-';
                let kredit = '-';
                let keterangan = '';

                if (d.tipe === 'Pengeluaran') {
                    kode = d.kode || '-';
                    deskripsi = d.kategori ? `${d.kategori} - ${d.uraian || ''}` : (d.uraian || '-');
                    user = d.pic || '-';
                    kredit = formatRp(d.nominal);
                    saldo -= d.nominal;
                    keterangan = d.keterangan || '-';
                } else {
                    kode = 'M-' + (d.kode || '');
                    deskripsi = d.uraian || '-';
                    user = d.sumberDana || 'Pusat';
                    debit = formatRp(d.nominal);
                    saldo += d.nominal;
                    keterangan = d.keterangan || 'Verified';
                }

                const saldob = saldo;
                previewHtml += `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                        <td class="p-3 text-center text-slate-600 dark:text-slate-400 text-sm">${idx + 1}</td>
                        <td class="p-3 font-bold text-slate-700 dark:text-slate-300 text-sm">${kode}</td>
                        <td class="p-3 text-slate-800 dark:text-slate-200 text-sm truncate max-w-xs">${deskripsi}</td>
                        <td class="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap text-sm">${dateFmt}</td>
                        <td class="p-3 text-slate-600 dark:text-slate-400 text-sm">${user}</td>
                        <td class="p-3 text-right font-semibold text-green-500 text-sm">${debit}</td>
                        <td class="p-3 text-right font-semibold text-red-500 text-sm">${kredit}</td>
                        <td class="p-3 text-right font-semibold ${saldob >= 0 ? 'text-green-500' : 'text-red-500'} text-sm">${formatRp(saldob)}</td>
                        <td class="p-3 text-slate-600 dark:text-slate-400 text-sm truncate">${keterangan}</td>
                    </tr>
                `;
            });
            previewHtml += `</tbody></table></div>`;
            if (parsedData.length > 10) { previewHtml += `<p class="text-xs text-center text-slate-500 dark:text-slate-400 mt-3 italic">...dan ${parsedData.length - 10} baris lainnya akan diimport.</p>`; }

            Swal.fire({ 
                title: '✓ Pratinjau Data Import', 
                html: previewHtml, 
                width: '1000px',
                background: isDark ? '#1e293b' : '#ffffff', 
                color: isDark ? '#f8fafc' : '#0f172a', 
                showCancelButton: true, 
                confirmButtonColor: '#16a34a', 
                cancelButtonColor: isDark ? '#334155' : '#94a3b8',
                confirmButtonText: '<i class="fas fa-check mr-2"></i>Ya, Import Sekarang',
                cancelButtonText: 'Batal'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    Swal.fire({ title: 'Memproses Import...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                    for (const item of parsedData) { await addKas(item); }
                    Swal.fire({ icon: 'success', title: 'Import Selesai', text: `Berhasil memproses ${parsedData.length} baris data.` });
                }
            }).finally(() => { event.target.value = ''; });

        } catch (error) { 
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Format file Excel tidak dapat dibaca.', background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a' }); 
            event.target.value = ''; 
        } 
    };
    reader.readAsArrayBuffer(file);
};

window.exportToPDF = function() {
    const isDark = document.documentElement.classList.contains('dark');
    // Check if jsPDF and html2canvas are loaded
    if (typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') {
        return Swal.fire({
            icon: 'error',
            title: 'Library PDF Belum Siap',
            text: 'Komponen untuk membuat PDF belum termuat. Harap tunggu beberapa saat dan coba lagi, atau muat ulang halaman.',
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
        });
    }

    const { jsPDF } = window.jspdf;
    const content = document.getElementById('main-content');
    const safeName = currentProject ? currentProject.name.replace(/[^a-z0-9]/gi, '_') : 'Proyek';

    Swal.fire({
        title: 'Mengekspor PDF...',
        text: 'Harap tunggu, sedang mempersiapkan dokumen.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    // Temporarily show the signature block for capture
    const signatureBlock = document.getElementById('signature-container');
    if (signatureBlock) signatureBlock.classList.remove('hidden');

    html2canvas(content, {
        scale: 2, // Increase scale for better quality
        useCORS: true,
        backgroundColor: isDark ? '#1A1A1A' : '#f8fafc' // Match body background
    }).then(canvas => {
        // Hide signature block again after capture
        if (signatureBlock) signatureBlock.classList.add('hidden');

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const imgWidth = pdfWidth;
        const imgHeight = imgWidth / ratio;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(`Laporan_Kas_${safeName}.pdf`);
        Swal.close();
    }).catch(err => {
        console.error("PDF export failed:", err);
        if (signatureBlock) signatureBlock.classList.add('hidden');
        Swal.fire('Gagal', 'Terjadi kesalahan saat membuat file PDF.', 'error');
    });
};

 window.showSignatureModal = function() {
    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
        title: 'Atur Tanda Tangan',
        background: isDark ? '#1e293b' : '#ffffff', 
        color: isDark ? '#f8fafc' : '#0f172a',
        html: `
            <div class="space-y-4 text-left mt-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Dibuat oleh:</label>
                    <input id="swal-sig-dibuat" value="${signatureData.dibuat}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" placeholder="Jabatan Pembuat">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Diperiksa oleh:</label>
                    <input id="swal-sig-diperiksa" value="${signatureData.diperiksa}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" placeholder="Jabatan Pemeriksa">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Disetujui oleh:</label>
                    <input id="swal-sig-disetujui" value="${signatureData.disetujui}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" placeholder="Jabatan Penyetuju">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#FF7A00',
        confirmButtonText: 'Simpan Pengaturan',
        preConfirm: () => {
            return {
                dibuat: document.getElementById('swal-sig-dibuat').value,
                diperiksa: document.getElementById('swal-sig-diperiksa').value,
                disetujui: document.getElementById('swal-sig-disetujui').value,
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            signatureData = result.value;
            localStorage.setItem('kas_signatures', JSON.stringify(signatureData));
            renderSignatureBlock();
            Swal.fire('Berhasil', 'Pengaturan tanda tangan disimpan.', 'success');
        }
    });
}

function renderSignatureBlock() {
    const container = document.getElementById('signature-container');
    if (!container) return;

    container.innerHTML = `
        <div class="w-full max-w-5xl mx-auto text-center text-sm text-slate-800 dark:text-slate-200 mt-12">
            <div class="grid grid-cols-3 gap-8">
                <div>
                    <p class="mb-20">Dibuat oleh,</p>
                    <p class="font-bold border-t border-slate-400 pt-2">${signatureData.dibuat}</p>
                </div>
                <div>
                    <p class="mb-20">Diperiksa oleh,</p>
                    <p class="font-bold border-t border-slate-400 pt-2">${signatureData.diperiksa}</p>
                </div>
                <div>
                    <p class="mb-20">Disetujui oleh,</p>
                    <p class="font-bold border-t border-slate-400 pt-2">${signatureData.disetujui}</p>
                </div>
            </div>
        </div>
    `;
}

window.printReport = function() {
    window.print();
}

window.saveReportData = async function() {
    const isDark = document.documentElement.classList.contains('dark');

    // Ambil nilai RAP dari input fields
    const rapValues = {};
    document.querySelectorAll('#resume-actual-table tbody input[data-code]').forEach(input => {
        const code = input.dataset.code;
        const value = parseInt(input.value.replace(/\D/g, '')) || 0;
        rapValues[code] = value;
    });

    // COGS dihitung dari total RAP (tidak perlu disimpan)
    const reportData = {
        rap: rapValues
    };

    Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        await updateProject(currentProjectId, { reportData });
        Swal.fire({ icon: 'success', title: 'Tersimpan!', text: 'Data laporan RAP dan COGS berhasil disimpan ke server.', background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a' });
    } catch (error) {
        console.error("Gagal menyimpan data laporan:", error);
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat menyimpan data ke server.', background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a' });
    }
}