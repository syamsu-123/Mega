import { getProjectById, getProjects, addHSEAssessment, updateProject } from './src/js/firebase-service.js';

let projects = [];
let currentProject = null;
let selectedProjectId = null;
let draftState = {
    items: {},
    assessor: '',
    notes: '',
    progress: 0,
    lastSaved: 0
};

// store recently removed/edited items for undo
draftState.trash = { groups: [], children: [], edits: [] };
// change history (array of {ts, user, action, target, detail})
draftState.history = [];
let expandedGroups = new Set();
let selectedCategory = 'all';
let searchQuery = '';
let autoSaveTimer = null;
let progressSaveTimer = null;
let isSaving = false;

let evaluationSchema = [];

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
function escapeHtml(s) { return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function formatPercent(value) {
    return `${Math.round(value)}%`;
}

function getItemState(item) {
    const stored = draftState.items[item.id] || {};
    return {
        buktiAda: Number(stored.buktiAda ?? 0),
        buktiTidak: Number(stored.buktiTidak ?? 0),
        statusAda: Number(stored.statusAda ?? 0),
        statusTidak: Number(stored.statusTidak ?? 0),
        maxScore: Number(stored.maxScore ?? item.maxScore),
        notes: stored.notes || ''
    };
}

function computeItemReal(item) {
    const state = getItemState(item);
    // Nilai Real dihitung dari penjumlahan sub-kolom yang terisi
    // Real = buktiAda + buktiTidak + statusAda + statusTidak
    return state.buktiAda + state.buktiTidak + state.statusAda + state.statusTidak;
}

function computeTotals() {
    const totalMax = evaluationSchema.reduce((sum, group) => sum + group.children.reduce((inner, item) => inner + Number(getItemState(item).maxScore), 0), 0);
    const totalReal = evaluationSchema.reduce((sum, group) => sum + group.children.reduce((inner, item) => inner + computeItemReal(item), 0), 0);
    const percentage = totalMax ? (totalReal * 100) / totalMax : 0;
    return { totalMax, totalReal, percentage: Math.round(percentage) };
}

function getEvaluationStatus(totalReal, totalMax) {
    if (totalReal === 0) return 'Belum Dinilai';
    if (totalReal < totalMax) return 'Proses';
    return 'Selesai';
}

function getStatusTheme(totalReal, totalMax) {
    const percent = totalMax ? (totalReal * 100) / totalMax : 0;
    if (percent >= 100) return { text: 'Selesai', dot: 'bg-emerald-500' };
    if (percent > 0) return { text: 'Proses', dot: 'bg-amber-500' };
    return { text: 'Belum Dinilai', dot: 'bg-slate-500' };
}

function renderProjectOptions() {
    const select = document.getElementById('projectSelector');
    if (!select) return;
    select.innerHTML = projects.length === 0
        ? '<option value="">Belum ada proyek tersedia</option>'
        : projects.map(project => `<option value="${project.id}">${project.name || project.code || 'Proyek tanpa nama'}</option>`).join('');
    if (selectedProjectId) select.value = selectedProjectId;
}

function renderProjectDisplay() {
    const display = document.getElementById('projectDisplay');
    if (!display) return;
    display.textContent = currentProject?.name || currentProject?.code || '-';
}

function renderCategoryFilters() {
    const filterContainer = document.getElementById('categoryFilters');
    if (!filterContainer) return;

    // 1. Collect all unique group IDs that currently have children in the schema
    const groupsToRender = [];
    evaluationSchema.forEach(group => {
        if (group && group.id && group.id.trim() !== '' && group.children && group.children.length > 0) {            groupsToRender.push(group);
        }
    });

    // 2. Sort the groups alphabetically by label
    groupsToRender.sort((a, b) => a.label.localeCompare(b.label));

    // 3. Ensure selectedCategory is still valid, otherwise reset to 'all'
    if (selectedCategory !== 'all' && !groupsToRender.some(g => g.id === selectedCategory)) {
        selectedCategory = 'all';
    }

    const allButton = `<button type="button" class="pill-btn ${selectedCategory === 'all' ? 'active' : 'text-slate-600 dark:text-slate-200'} rounded-full px-4 py-2 text-sm font-semibold" onclick="setCategoryFilter('all')">Semua</button>`;
    const groupButtons = groupsToRender.map(group => {
        const label = typeof group.label === 'string' && group.label.trim().length > 0 ? group.label.trim() :
                      (typeof group.keterangan === 'string' && group.keterangan.trim().length > 0 ? group.keterangan.trim() :
                      (group.children && group.children.length > 0 && typeof group.children[0].label === 'string' ? group.children[0].label.trim() : `Group ${group.id}`));

        return `
            <button type="button" class="pill-btn ${selectedCategory === group.id ? 'active' : 'text-slate-600 dark:text-slate-200'} rounded-full px-4 py-2 text-sm font-semibold" onclick="setCategoryFilter('${group.id}')">${escapeHtml(label)}</button>
        `;
    }).join('');
    filterContainer.innerHTML = allButton + groupButtons;
}

function renderSummaryCards() {
    const nameEl = document.getElementById('projectNameValue');
    const maxEl = document.getElementById('projectTotalMax');
    const realEl = document.getElementById('projectTotalReal');
    const percentEl = document.getElementById('projectPercentage');
    const statusEl = document.getElementById('summaryStatus');
    const badgeText = document.getElementById('summaryBadgeText');
    const badgeDot = document.getElementById('summaryBadgeDot');

    const { totalMax, totalReal, percentage } = computeTotals();
    const status = getEvaluationStatus(totalReal, totalMax);
    const theme = getStatusTheme(totalReal, totalMax);

    if (nameEl) nameEl.textContent = currentProject?.name || '-';
    if (maxEl) maxEl.textContent = totalMax.toString();
    if (realEl) realEl.textContent = totalReal.toString();
    if (percentEl) percentEl.textContent = formatPercent(percentage);
    if (statusEl) statusEl.textContent = status;
    if (badgeText) badgeText.textContent = status;
    if (badgeDot) badgeDot.className = theme.dot;
    const statusDetail = document.getElementById('footerStatusDetail');
    if (statusDetail) statusDetail.textContent = status === 'Selesai' ? 'Semua dokumen lengkap dan siap diajukan.' : status === 'Proses' ? 'Beberapa dokumen telah lengkap, lanjutkan pengecekan.' : 'Mulai penilaian untuk mendapatkan skor akhir.';
    const footerStatus = document.getElementById('footerStatus');
    if (footerStatus) footerStatus.textContent = status;
}

function renderProjectStats() {
    const value = document.getElementById('projectProgressValue');
    const bar = document.getElementById('projectProgressBar');
    const progressInput = document.getElementById('projectProgressInput');
    if (!value || !bar || !progressInput || !currentProject) return;
    const progress = Number(currentProject.progress ?? draftState.progress ?? 0);
    // Progress is sourced from project data only
    progressInput.value = progress;
    value.textContent = `${progress}%`;
    bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
}


function applyDraftAndProject() {
    if (!currentProject) return;
    const draft = currentProject.hseEvaluationDraft || {};
    draftState = {
        items: draft.items || {},
        assessor: draft.assessor || sessionStorage.getItem('userName') || '',
        notes: draft.notes || '',
        progress: Number(draft.progress ?? currentProject.progress ?? 0),
        lastSaved: draft.lastSaved || 0
    };
    // load history if present
    draftState.history = draft.history || [];
    // If project draft contains a stored schema, prefer it over the default JSON schema
    if (draft.schema && Array.isArray(draft.schema) && draft.schema.length > 0) {
        evaluationSchema = draft.schema;
        evaluationSchema.forEach(group => expandedGroups.add(group.id));
    }
    const assessorName = document.getElementById('assessor-name');
    if (assessorName) assessorName.value = draftState.assessor;
    const notes = document.getElementById('assessment-notes');
    if (notes) notes.value = draftState.notes;
    renderProjectStats();
    renderHistory();
}

function renderAutoSaveStatus() {
    const statusEl = document.getElementById('autoSaveStatus');
    if (!statusEl) return;
    if (isSaving) {
        statusEl.textContent = 'Menyimpan otomatis...';
        return;
    }
    if (!draftState.lastSaved) {
        statusEl.textContent = 'Belum ada perubahan yang disimpan.';
        return;
    }
    const date = new Date(draftState.lastSaved);
    const formatted = date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    statusEl.textContent = `Tersimpan otomatis: ${formatted}`;
}

function getCurrentUserName() {
    return draftState.assessor || sessionStorage.getItem('userName') || 'Administrator';
}

function pushHistory(entry) {
    const record = Object.assign({ ts: Date.now(), user: getCurrentUserName() }, entry);
    draftState.history = draftState.history || [];
    draftState.history.unshift(record);
    // limit to last 200 entries
    if (draftState.history.length > 200) draftState.history.length = 200;
    renderHistory();
    queueAutoSave();
}

function formatTime(ts) {
    try { return new Date(ts).toLocaleString('id-ID'); } catch { return String(ts); }
}

function renderHistory() {
    const container = document.getElementById('changeHistory');
    if (!container) return;
    const items = (draftState.history || []);
    if (items.length === 0) {
        container.innerHTML = '<div class="px-4 py-6 text-slate-500">Belum ada riwayat perubahan.</div>';
        return;
    }

    function friendlyFieldLabel(k) {
        return ({ status: 'Status', docStatus: 'Status Dokumen', maxScore: 'Nilai Maks', label: 'Label', assessor: 'Assessor', notes: 'Catatan', groupId: 'Group', child: 'Child', buktiAda: 'Bukti Dokumen - Ada', buktiTidak: 'Bukti Dokumen - Tidak Ada', statusAda: 'Status - Ada', statusTidak: 'Status - Tidak Ada' }[k] || k);
    }

    function formatDateWIB(ts) {
        const d = new Date(ts);
        const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
        const day = d.getDate().toString().padStart(2,'0');
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        const hours = d.getHours().toString().padStart(2,'0');
        const mins = d.getMinutes().toString().padStart(2,'0');
        return `${day} ${month} ${year} • ${hours}:${mins} WIB`;
    }

    function safeObjectLabel(obj) {
        if (!obj || typeof obj !== 'object') return escapeHtml(String(obj));
        const label = obj.nama || obj.name || obj.title || obj.keterangan || obj.label || obj.id;
        if (label) return escapeHtml(label);
        return `<pre class="history-object-debug">${escapeHtml(JSON.stringify(obj, null, 2))}</pre>`;
    }

    function getBadgeInfo(action) {
        const normalized = String(action || '').toLowerCase();
        if (normalized.includes('create') || normalized.includes('add')) return { text: 'CREATE', icon: '➕', className: 'history-badge-create' };
        if (normalized.includes('update') || normalized.includes('edit')) return { text: 'UPDATE', icon: '✏️', className: 'history-badge-update' };
        if (normalized.includes('delete') || normalized.includes('remove')) return { text: 'DELETE', icon: '🗑️', className: 'history-badge-delete' };
        if (normalized.includes('upload')) return { text: 'UPLOAD', icon: '⬆️', className: 'history-badge-upload' };
        return { text: normalized.toUpperCase() || 'INFO', icon: 'ℹ️', className: 'history-badge-info' };
    }

    function renderDetailHTML(detail) {
        if (!detail) return '<div class="text-sm text-slate-500">-</div>';

        if (detail.child) {
            const childId = detail.child.id || detail.target || detail.child.id || '';
            return `
                <div class="history-detail-grid">
                    <div class="history-detail-row"><div class="history-detail-label">🆔 ID Item</div><div class="history-detail-value">${safeObjectLabel(childId)}</div></div>
                    <div class="history-detail-row"><div class="history-detail-label">📂 Child</div><div class="history-detail-value">${safeObjectLabel(detail.child)}</div></div>
                    ${ detail.groupId ? `<div class="history-detail-row"><div class="history-detail-label">🗂 Group</div><div class="history-detail-value">${escapeHtml(detail.groupId)}</div></div>` : '' }
                </div>
            `;
        }

        if (detail.field && (detail.before !== undefined || detail.after !== undefined)) {
            const fieldLabel = friendlyFieldLabel(detail.field);
            const before = detail.before === null || detail.before === undefined || detail.before === '' ? 'Belum Ada' : escapeHtml(detail.before);
            const after = detail.after === null || detail.after === undefined || detail.after === '' ? 'Belum Ada' : escapeHtml(detail.after);
            return `
                <div class="history-detail-grid">
                    <div class="history-detail-row"><div class="history-detail-label">Field</div><div class="history-detail-value">${escapeHtml(fieldLabel)}</div></div>
                    <div class="history-detail-row"><div class="history-detail-label">Sebelum</div><div class="history-detail-value">${before}</div></div>
                    <div class="history-detail-row"><div class="history-detail-label">Sesudah</div><div class="history-detail-value">${after}</div></div>
                </div>
            `;
        }

        if (detail.before && detail.after && typeof detail.before === 'object' && typeof detail.after === 'object') {
            const before = detail.before; const after = detail.after;
            const keys = Array.from(new Set(Object.keys(before).concat(Object.keys(after))));
            const rows = keys.map(k => {
                const b = (before[k] === null || before[k] === undefined || before[k] === '') ? 'Belum Ada' : escapeHtml(before[k]);
                const a = (after[k] === null || after[k] === undefined || after[k] === '') ? 'Belum Ada' : escapeHtml(after[k]);
                if (b === a) return '';
                return `<div class="history-detail-row"><div class="history-detail-label">${escapeHtml(friendlyFieldLabel(k))}</div><div class="history-detail-value">${b} → ${a}</div></div>`;
            }).filter(Boolean).join('');
            return rows ? `<div class="history-detail-grid">${rows}</div>` : '<div class="text-sm text-slate-500">(Tidak ada perubahan terdeteksi)</div>';
        }

        if (Array.isArray(detail.items) || detail.count) {
            const total = detail.count || (Array.isArray(detail.items) ? detail.items.length : 0) || 0;
            const list = Array.isArray(detail.items) ? detail.items.slice(0, 10).map(i => `<div class="history-detail-value">${escapeHtml(i)}</div>`).join('') + (detail.items.length > 10 ? `<div class="history-detail-value">...dan ${detail.items.length - 10} lainnya</div>` : '') : '';
            return `<div class="history-detail-grid"><div class="history-detail-row"><div class="history-detail-label">Jumlah Item</div><div class="history-detail-value">${total}</div></div>${list}</div>`;
        }

        if (typeof detail === 'object') {
            const rows = Object.keys(detail).map(k => `<div class="history-detail-row"><div class="history-detail-label">${escapeHtml(friendlyFieldLabel(k))}</div><div class="history-detail-value">${safeObjectLabel(detail[k])}</div></div>`).join('');
            return rows ? `<div class="history-detail-grid">${rows}</div>` : '<div class="text-sm text-slate-500">-</div>';
        }

        return `<div class="history-detail-grid"><div class="history-detail-row"><div class="history-detail-label">Detail</div><div class="history-detail-value">${escapeHtml(String(detail))}</div></div></div>`;
    }

    const html = items.map(h => {
        const date = formatDateWIB(h.ts);
        const user = escapeHtml(h.user || 'System');
        const actionLabel = (function(a){
            const map = { update_item: 'Mengubah Item', edit_item: 'Mengubah Item', delete_item: 'Menghapus Item', add_group: 'Menambah Group', edit_group: 'Mengubah Group', delete_group: 'Menghapus Group', create_table: 'Membuat Tabel', undo_delete_item: 'Mengembalikan Item', undo_delete_group: 'Mengembalikan Group', undo_edit_item: 'Membatalkan Edit' };
            return map[a] || escapeHtml(a);
        })(h.action);
        const target = escapeHtml(h.target || '');
        const badge = getBadgeInfo(h.action);
        const icon = badge.icon;
        return `
            <div class="history-row-wrapper">
                <div class="history-card">
                    <div class="history-card-header">
                        <div class="history-card-title"><span class="history-activity-icon">${icon}</span>${escapeHtml(actionLabel)}</div>
                        <div class="history-badge ${badge.className}"><span>${badge.icon}</span>${badge.text}</div>
                    </div>
                    <div class="history-card-meta"><span>👤 ${user}</span><span>🕒 ${date}</span></div>
                    ${ target ? `<div class="history-detail-grid"><div class="history-detail-row"><div class="history-detail-label">🆔 ID Item</div><div class="history-detail-value">${target}</div></div></div>` : '' }
                    <div class="history-card-divider"></div>
                    ${renderDetailHTML(h.detail)}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="history-timeline">${html}</div>`;
}

function renderGroupDescriptions() {
    const container = document.getElementById('tableDescriptions');
    if (!container) return;
    if (!evaluationSchema || evaluationSchema.length === 0) {
        container.textContent = 'Tidak ada keterangan tabel.';
        return;
    }
    const html = evaluationSchema.map(g => {
        const keterangan = g.keterangan || g.description || '';
        const desc = keterangan ? `<div class="text-xs text-slate-500 dark:text-slate-400">${escapeHtml(keterangan)}</div>` : '';
        return `<div class="mb-2"><div class="font-semibold">${escapeHtml(g.label)}</div>${desc}</div>`;
    }).join('');
    container.innerHTML = html;
}

function getVisibleChildren(group) {
    const query = searchQuery.trim().toLowerCase();
    const categoryMatch = selectedCategory === 'all' || selectedCategory === group.id;
    if (!categoryMatch) return [];
    return group.children.filter(item => item.label.toLowerCase().includes(query) || group.label.toLowerCase().includes(query));
}

function renderEvaluationTable() {
    const body = document.getElementById('evaluationTableBody');
    if (!body) return;

    const tableHtml = evaluationSchema.map((group, index) => {
        const visibleChildren = getVisibleChildren(group);
        if (visibleChildren.length === 0) return '';

        // compute totals for the whole group (use draftState values when available)
        const groupTotalMax = (group.children||[]).reduce((s, it) => s + Number(getItemState(it).maxScore || 0), 0);
        const groupTotalReal = (group.children||[]).reduce((s, it) => s + computeItemReal(it), 0);

        // Parent/group header row: single cell spanning all columns with expand control (clean and aligned).
        const groupRows = [
            `<tr class="group-row">
                <td class="group-cell" colspan="9">
                    <button type="button" class="toggle-group" onclick="toggleGroup('${group.id}')">
                        <i class="fas ${expandedGroups.has(group.id) ? 'fa-chevron-down' : 'fa-chevron-right'}"></i>
                        <i class="fas fa-folder"></i>
                        <span>${escapeHtml(group.label)}</span>
                    </button>
                </td>
            </tr>`];

        visibleChildren.forEach(item => {
            const state = getItemState(item);
            const hasValue = state.buktiAda > 0 || state.buktiTidak > 0 || state.statusAda > 0 || state.statusTidak > 0;
            const completeCheck = state.buktiAda > 0 && state.statusAda > 0;
            const rowClass = completeCheck
                ? 'bg-emerald-50/40 dark:bg-emerald-900/15 border-emerald-200/40 dark:border-emerald-600/20'
                : hasValue
                ? 'bg-amber-50/40 dark:bg-amber-900/15 border-amber-200/40 dark:border-amber-600/20'
                : 'bg-red-50/40 dark:bg-red-900/15 border-red-200/40 dark:border-red-600/20';
            const collapsed = expandedGroups.has(group.id) ? '' : 'hidden';
            const realValue = computeItemReal(item);

            groupRows.push(`
                <tr class="child-row ${collapsed} border-b border-slate-200 dark:border-slate-700 ${rowClass}">
                    <td class="px-3 py-4 text-slate-600 dark:text-slate-300 text-center text-xs">${item.no}</td>
                    <td class="px-3 py-4 text-slate-800 dark:text-slate-100">
                        <div class="ml-4 font-medium text-xs">
                            <span>${item.label}</span>
                        </div>
                    </td>
                    <td class="px-2 py-4 text-center">
                        <input type="number" min="0" step="1" class="sub-input sub-input-ada" value="${state.buktiAda}" onchange="updateItemValue('${item.id}', 'buktiAda', event.target.value)" />
                    </td>
                    <td class="px-2 py-4 text-center">
                        <input type="number" min="0" step="1" class="sub-input sub-input-tidak" value="${state.buktiTidak}" onchange="updateItemValue('${item.id}', 'buktiTidak', event.target.value)" />
                    </td>
                    <td class="px-2 py-4 text-center">
                        <input type="number" min="0" step="1" class="sub-input sub-input-ada" value="${state.statusAda}" onchange="updateItemValue('${item.id}', 'statusAda', event.target.value)" />
                    </td>
                    <td class="px-2 py-4 text-center">
                        <input type="number" min="0" step="1" class="sub-input sub-input-tidak" value="${state.statusTidak}" onchange="updateItemValue('${item.id}', 'statusTidak', event.target.value)" />
                    </td>
                    <td class="px-3 py-4 text-center">
                        <input type="number" min="0" step="1" class="val-input rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:border-orange-500 transition" value="${state.maxScore}" onchange="updateItemValue('${item.id}', 'maxScore', event.target.value)" />
                    </td>
                    <td class="px-3 py-4 font-semibold text-slate-900 dark:text-slate-100 text-center text-xs">${realValue}</td>
                    <td class="px-3 py-4 keterangan-cell">
                        <div class="flex items-center justify-between">
                            <div class="keterangan-text text-xs">${(item.keterangan || item.description) ? escapeHtml(item.keterangan || item.description) : ''}</div>
                            <div class="flex items-center gap-2 ml-2">
                                <button class="icon-btn edit" title="Edit" onclick="editChild('${item.id}')"><i class="fas fa-pencil-alt"></i></button>
                                <button class="icon-btn delete" title="Hapus" onclick="deleteChild('${item.id}')"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </div>
                    </td>
                </tr>
            `);
        });

        return groupRows.join('');
    }).join('');

    body.innerHTML = (tableHtml || '<tr><td colspan="9" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">Tidak ada item yang sesuai filter.</td></tr>');
    renderSummaryCards();
    renderFooterTotals();
    renderGroupDescriptions();
}

function renderFooterTotals() {
    const { totalMax, totalReal, percentage } = computeTotals();
    const footerTotalMax = document.getElementById('footerTotalMax');
    const footerTotalReal = document.getElementById('footerTotalReal');
    const footerPercentage = document.getElementById('footerPercentage');
    const footerBar = document.getElementById('footerProgressBar');

    if (footerTotalMax) footerTotalMax.textContent = `Total Maks: ${totalMax}`;
    if (footerTotalReal) footerTotalReal.textContent = `Total Real: ${totalReal}`;
    if (footerPercentage) footerPercentage.textContent = `Persentase: ${percentage}%`;
    if (footerBar) footerBar.style.width = `${percentage}%`;
    const tableFooterMax = document.getElementById('tableFooterTotalMax');
    const tableFooterReal = document.getElementById('tableFooterTotalReal');
    const tableFooterPerc = document.getElementById('tableFooterPercentage');
    if (tableFooterMax) tableFooterMax.textContent = totalMax.toString();
    if (tableFooterReal) tableFooterReal.textContent = totalReal.toString();
    if (tableFooterPerc) tableFooterPerc.textContent = `${percentage}%`;
}

function queueAutoSave() {
    if (!currentProject) return;
    isSaving = true;
    renderAutoSaveStatus();
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(saveDraft, 800);
}

async function saveDraft() {
    if (!currentProject) return;
    const payload = {
        hseEvaluationDraft: {
            items: draftState.items,
            assessor: draftState.assessor,
            notes: draftState.notes,
            progress: Number(currentProject.progress ?? draftState.progress ?? 0),
            lastSaved: Date.now()
        }
    };
    try {
        // include current schema so edits/deletes persist on the project document
        payload.hseEvaluationDraft.schema = evaluationSchema;
        // include history
        payload.hseEvaluationDraft.history = draftState.history || [];
        const ok = await updateProject(currentProject.id, payload);
        if (ok) {
            draftState.lastSaved = payload.hseEvaluationDraft.lastSaved;
        } else {
            console.error('saveDraft: updateProject returned false');
            const isDark = document.documentElement.classList.contains('dark');
            Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Gagal menyimpan draft HSE ke Firestore', showConfirmButton: false, timer: 3000, background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' });
        }
    } catch (error) {
        console.error('Auto-save HSE draft gagal:', error);
        const isDark = document.documentElement.classList.contains('dark');
        const msg = (error && error.message) ? error.message : 'Kesalahan jaringan atau aturan keamanan Firestore.';
        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: `Auto-save gagal: ${msg}`, showConfirmButton: false, timer: 5000, background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' });
    }
    isSaving = false;
    renderAutoSaveStatus();
}

function updateItemValue(itemId, field, value) {
    if (!draftState.items[itemId]) draftState.items[itemId] = {};
    const prev = Object.assign({}, draftState.items[itemId]);
    const newVal = ['buktiAda','buktiTidak','statusAda','statusTidak','maxScore'].includes(field) ? Number(value) : value;
    draftState.items[itemId][field] = newVal;
    if (['maxScore','buktiAda','buktiTidak','statusAda','statusTidak'].includes(field) && draftState.items[itemId][field] < 0) draftState.items[itemId][field] = 0;
    // push history entry if changed
    const changed = (prev[field] !== draftState.items[itemId][field]);
    if (changed) {
        pushHistory({ action: 'update_item', target: itemId, detail: { field, before: prev[field], after: draftState.items[itemId][field] } });
    }
    renderEvaluationTable();
    queueAutoSave();
}

function toggleGroup(groupId) {
    if (expandedGroups.has(groupId)) {
        expandedGroups.delete(groupId);
    } else {
        expandedGroups.add(groupId);
    }
    renderEvaluationTable();
}

function setCategoryFilter(category) {
    selectedCategory = category;
    renderCategoryFilters();
    renderEvaluationTable();
}

function handleSearch(query) {
    searchQuery = query;
    renderEvaluationTable();
}

function updateAssessor(value) {
    draftState.assessor = value;
    queueAutoSave();
}

function updateNotes(value) {
    draftState.notes = value;
    queueAutoSave();
}

async function handleProgressChange(value) {
    if (!currentProject) return;
    const progressValue = Math.min(100, Math.max(0, Number(value)));
    currentProject.progress = progressValue;
    renderProjectStats();
    if (progressSaveTimer) clearTimeout(progressSaveTimer);
    progressSaveTimer = setTimeout(async () => {
        try {
            await updateProject(currentProject.id, { progress: progressValue });
        } catch (error) {
            console.error('Gagal menyimpan progress proyek:', error);
        }
    }, 800);
}

async function finalizeAssessment() {
    if (!currentProject) return;
    const { totalMax, totalReal, percentage } = computeTotals();
    const status = getEvaluationStatus(totalReal, totalMax);
    const confirmResult = window.confirm('Simpan final penilaian HSE ini? Perubahan akan terekam sebagai penilaian akhir.');
    if (!confirmResult) return;

    const assessmentData = {
        projectId: currentProject.id,
        projectName: currentProject.name,
        assessor: draftState.assessor || sessionStorage.getItem('userName') || 'Administrator',
        date: new Date().toISOString().slice(0, 10),
        notes: draftState.notes,
        score: totalReal,
        percentage,
        status,
        items: Object.entries(draftState.items).map(([id, item]) => ({ id, ...item })),
        timestamp: Date.now()
    };

    const summary = {
        hseScore: totalReal,
        hseEvaluationStatus: status,
        hseEvaluationFinalizedAt: Date.now(),
        hseEvaluationDraft: {
            ...draftState,
            lastSaved: Date.now(),
            schema: evaluationSchema
        }
    };

    try {
        await addHSEAssessment(assessmentData);
        await updateProject(currentProject.id, summary);
        const isDark = document.documentElement.classList.contains('dark');
        Swal.fire({ title: 'Berhasil', text: 'Penilaian HSE berhasil disimpan.', icon: 'success', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' });
        draftState.lastSaved = Date.now();
        renderAutoSaveStatus();
        renderSummaryCards();
    } catch (error) {
        console.error('Gagal menyimpan final assessment:', error);
        const isDark = document.documentElement.classList.contains('dark');
        Swal.fire({ title: 'Gagal', text: 'Terjadi masalah saat menyimpan penilaian.', icon: 'error', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' });
    }
}

async function createEvaluationTable() {
    const createBtn = document.getElementById('createTableBtn');
    if (createBtn) {
        createBtn.disabled = true;
        createBtn.classList.add('opacity-60', 'cursor-not-allowed');
        createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Membuat...';
    }

    console.log('createEvaluationTable: start');

    if (!evaluationSchema || evaluationSchema.length === 0) {
        const ok = await loadSchema();
        if (!ok) {
            alert('Schema penilaian belum tersedia. Coba muat ulang halaman.');
            return;
        }
    }
    // Build draft items from schema
    const newItems = {};
    evaluationSchema.forEach(group => {
        group.children.forEach(item => {
            newItems[item.id] = {
                buktiAda: 0,
                buktiTidak: 0,
                statusAda: 0,
                statusTidak: 0,
                maxScore: Number(item.maxScore ?? 0),
                notes: ''
            };
        });
    });

    draftState.items = newItems;
    // record history for table creation
    pushHistory({ action: 'create_table', target: currentProject ? currentProject.id : 'local', detail: { items: Object.keys(newItems).slice(0,50), count: Object.keys(newItems).length } });
    draftState.lastSaved = 0;
    renderEvaluationTable();
    queueAutoSave();

    const statusEl = document.getElementById('autoSaveStatus');
    if (statusEl) statusEl.textContent = 'Tabel penilaian dibuat (draft). Menyimpan...';

    // Optionally save draft immediately to project
    try {
        if (currentProject && currentProject.id) {
            await saveDraft();
            console.log('createEvaluationTable: draft saved to project', currentProject.id);
            if (statusEl) statusEl.textContent = 'Tabel penilaian dibuat dan disimpan sebagai draft.';
        } else {
            console.log('createEvaluationTable: no currentProject, draft kept local');
            if (statusEl) statusEl.textContent = 'Tabel penilaian dibuat sebagai draft lokal. Pilih proyek untuk menyimpan.';
        }
    } catch (err) {
        console.error('Gagal menyimpan draft awal:', err);
        if (statusEl) statusEl.textContent = 'Gagal menyimpan draft awal. Cek console untuk detail.';
    }

    if (createBtn) {
        createBtn.disabled = false;
        createBtn.classList.remove('opacity-60', 'cursor-not-allowed');
        createBtn.innerHTML = '<i class="fas fa-table"></i> Buat Tabel';
    }
}

function renderPage() {
    if (!currentProject) return;
    renderProjectOptions();
    renderCategoryFilters();
    renderProjectStats();
    renderAutoSaveStatus();
    renderSummaryCards();
    renderEvaluationTable();
    renderGroupDescriptions();
}

async function handleImportExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const isDark = document.documentElement.classList.contains('dark');
    const swalOptions = { background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' };

    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // Get raw rows for mapping and preview
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            if (rows.length === 0) {
                Swal.fire({ ...swalOptions, icon: 'warning', title: 'Data Kosong', text: 'File Excel tidak memiliki data.' });
                return;
            }

            // Get headers from first row that looks like a header
            let headerRowIndex = 0;
            let excelHeaders = rows[0].map(h => String(h).trim());
            
            // If first row is empty, try to find the first non-empty row
            for(let i=0; i < Math.min(rows.length, 10); i++) {
                if (rows[i].some(cell => String(cell).trim() !== '')) {
                    headerRowIndex = i;
                    excelHeaders = rows[i].map(h => String(h).trim());
                    break;
                }
            }

            const fields = [
                { id: 'map-no', label: 'No', aliases: ['no', 'nomor'] },
                { id: 'map-jenis', label: 'Jenis Laporan / Uraian *', aliases: ['jenis laporan', 'uraian', 'pekerjaan', 'item'], required: true },
                { id: 'map-maks', label: 'Nilai Maks *', aliases: ['nilai maks', 'max', 'score', 'nilai'], required: true },
                { id: 'map-ket', label: 'Keterangan', aliases: ['keterangan', 'deskripsi', 'description', 'remarks'] }
            ];

            let mapHtml = `
                <div class="text-left text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Pilih kolom dari file Excel Anda yang sesuai dengan data sistem:
                </div>
                <div class="space-y-3 text-left">
            `;

            fields.forEach(f => {
                let options = `<option value="">-- Abaikan --</option>`;
                let matched = false;
                excelHeaders.forEach((h, idx) => {
                    if (!h) return;
                    let hLower = h.toLowerCase();
                    let isMatch = !matched && (f.aliases.some(a => hLower.includes(a)));
                    if (isMatch) matched = true;
                    options += `<option value="${idx}" ${isMatch ? 'selected' : ''}>${h}</option>`;
                });
                
                mapHtml += `
                    <div>
                        <label class="block text-xs font-semibold mb-1">${f.label}</label>
                        <select id="${f.id}" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm outline-none focus:border-green-500">
                            ${options}
                        </select>
                    </div>
                `;
            });
            mapHtml += `</div>`;

            const mappingResult = await Swal.fire({
                ...swalOptions,
                title: 'Mapping Kolom Excel',
                html: mapHtml,
                showCancelButton: true,
                confirmButtonText: 'Lanjut Pratinjau',
                cancelButtonText: 'Batal',
                confirmButtonColor: '#16a34a',
                preConfirm: () => {
                    const mapped = {};
                    let missing = [];
                    fields.forEach(f => {
                        const val = document.getElementById(f.id).value;
                        if (f.required && val === "") missing.push(f.label.replace(' *', ''));
                        mapped[f.id] = val !== "" ? parseInt(val) : null;
                    });
                    if (missing.length > 0) {
                        Swal.showValidationMessage(`Kolom ${missing.join(', ')} wajib dipilih!`);
                        return false;
                    }
                    return mapped;
                }
            });

            if (!mappingResult.isConfirmed) return;

            const colIndices = mappingResult.value;
            const merges = worksheet['!merges'] || [];
            const parsedSchema = [];
            let currentGroup = null;

            // Process data starting from row after header
            for (let i = headerRowIndex + 1; i < rows.length; i++) {
                const row = rows[i];
                if (!Array.isArray(row) || row.every(cell => String(cell).trim() === '')) continue;

                const jenisLaporanCell = colIndices['map-jenis'] !== null ? String(row[colIndices['map-jenis']] || '').trim() : '';
                const noCell = colIndices['map-no'] !== null ? String(row[colIndices['map-no']] || '').trim() : '';
                
                // Cerdas detect group: 
                // 1. Sel yang di-merge
                // 2. No adalah angka bulat (1, 2, 3)
                // 3. No kosong tapi Jenis Laporan ada
                const isMerged = merges.some(m => m.s.r === i && m.s.c === colIndices['map-jenis']);
                const isWholeNumber = noCell && !isNaN(noCell) && !noCell.includes('.') && !noCell.includes(',');
                const isGroup = isMerged || isWholeNumber || (jenisLaporanCell && !noCell);

                if (isGroup && jenisLaporanCell) {
                    currentGroup = {
                        id: `g-${Date.now()}-${i}`,
                        label: jenisLaporanCell,
                        keterangan: (colIndices['map-ket'] !== null ? String(row[colIndices['map-ket']] || '') : ''),
                        children: []
                    };
                    parsedSchema.push(currentGroup);
                } else if (currentGroup && jenisLaporanCell) {
                    const maxScore = colIndices['map-maks'] !== null ? Number(row[colIndices['map-maks']]) || 0 : 0;
                    const child = {
                        id: `item-${Date.now()}-${i}`,
                        no: noCell,
                        label: jenisLaporanCell,
                        maxScore: maxScore,
                        keterangan: (colIndices['map-ket'] !== null ? String(row[colIndices['map-ket']] || '') : '')
                    };
                    currentGroup.children.push(child);
                }
            }

            if (parsedSchema.length === 0) {
                Swal.fire({ ...swalOptions, icon: 'warning', title: 'Data Kosong', text: 'Tidak ada data grup/item yang dapat diproses. Cek kembali mapping kolom Anda.' });
                return;
            }

            // 3. Tampilkan Pratinjau
            let previewHtml = `
                <div class="text-left text-sm text-slate-600 dark:text-slate-400 mb-4">
                    <p>Ditemukan <strong>${parsedSchema.length} grup</strong> dengan total <strong>${parsedSchema.reduce((acc, g) => acc + g.children.length, 0)} item</strong>.</p>
                </div>
                <div class="text-left max-h-[60vh] overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">`;
            
            parsedSchema.forEach(group => {
                previewHtml += `<div class="font-bold text-sm p-2 bg-slate-100 dark:bg-slate-800 rounded mt-2">${escapeHtml(group.label)}</div>`;
                previewHtml += '<table class="w-full text-xs mt-1"><tbody>';
                group.children.forEach(child => {
                    previewHtml += `
                        <tr class="border-b border-slate-100 dark:border-slate-800">
                            <td class="p-1 w-8 text-slate-500">${escapeHtml(child.no)}</td>
                            <td class="p-1 text-slate-700 dark:text-slate-300">${escapeHtml(child.label)}</td>
                            <td class="p-1 w-16 text-right font-semibold text-green-600">${child.maxScore}</td>
                        </tr>`;
                });
                previewHtml += '</tbody></table>';
            });
            previewHtml += '</div>';

            Swal.fire({
                ...swalOptions,
                title: 'Pratinjau Import',
                html: previewHtml,
                width: '700px',
                showCancelButton: true,
                confirmButtonColor: '#16a34a',
                confirmButtonText: 'Ya, Import Sekarang',
                cancelButtonText: 'Batal',
            }).then((result) => {
                if (result.isConfirmed) {
                    importSchema(parsedSchema, file.name);
                    Swal.fire({ ...swalOptions, icon: 'success', title: 'Berhasil', text: 'Data HSE berhasil diimport.' });
                }
            });

        } catch (error) {
            console.error("Gagal mengimpor file Excel:", error);
            Swal.fire({ ...swalOptions, icon: 'error', title: 'Error', text: 'Gagal memproses file Excel. Pastikan formatnya benar.' });
        } finally {
            event.target.value = '';
        }
    };

    reader.readAsArrayBuffer(file);
}

function importSchema(parsedSchema, sourceFileName) {
    evaluationSchema = parsedSchema;
    expandedGroups.clear();
    const newItems = {};
    evaluationSchema.forEach(group => {
        expandedGroups.add(group.id);
        (group.children || []).forEach(item => {
            newItems[item.id] = {
                buktiAda: 0,
                buktiTidak: 0,
                statusAda: 0,
                statusTidak: 0,
                maxScore: Number(item.maxScore ?? 0),
                notes: ''
            };
        });
    });
    draftState.items = newItems;

    pushHistory({ action: 'import_excel', detail: { file: sourceFileName, count: Object.keys(newItems).length, groups: parsedSchema.length } });

    renderCategoryFilters();
    renderEvaluationTable();
    renderSummaryCards();
    renderFooterTotals();
    saveDraft(); // Persist the new schema
}

async function selectProject(projectId) {
    const project = await getProjectById(projectId);
    if (!project) return;
    currentProject = project;
    selectedProjectId = projectId;
    applyDraftAndProject();
    renderPage();
}

async function init() {
    // Do not auto-load the global schema on init so the table
    // doesn't appear automatically for projects that haven't
    // created a table. Schema will be loaded when the user
    // explicitly creates a table or when a project draft contains
    // a stored schema (handled in applyDraftAndProject()).
    projects = await getProjects();
    if (!projects || projects.length === 0) {
        document.getElementById('projectSelector').innerHTML = '<option value="">Belum ada proyek tersedia</option>';
        document.getElementById('autoSaveStatus').textContent = 'Tidak ada proyek yang dapat dinilai.';
        return;
    }
    renderProjectOptions();
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get('id');
    selectedProjectId = paramId && projects.some(p => p.id === paramId) ? paramId : projects[0].id;
    if (selectedProjectId) {
        document.getElementById('projectSelector').value = selectedProjectId;
        await selectProject(selectedProjectId);
    }

    // Update project display
    renderProjectDisplay();

    // Hide loading indicator and reveal main content
    try {
        const loadingIndicator = document.getElementById('loading-indicator');
        const mainContent = document.getElementById('main-content');
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        if (mainContent) mainContent.classList.remove('hidden');
    } catch (err) {
        console.warn('Unable to toggle loading/main content visibility', err);
    }
}

async function loadSchema() {
    const attempts = [];
    // Preferred: resolve relative to this module
    try {
        const url = new URL('./src/data/hse-schema.json', import.meta.url).href;
        attempts.push(url);
    } catch (_) {
        // ignore
    }
    attempts.push('./src/data/hse-schema.json', 'src/data/hse-schema.json', '/src/data/hse-schema.json');

    for (const p of attempts) {
        try {
            console.log('loadSchema: trying', p);
            const res = await fetch(p);
            if (res.ok) {
                evaluationSchema = await res.json();
                evaluationSchema.forEach(group => expandedGroups.add(group.id));
                console.log('loadSchema: loaded from', p);
                return true;
            } else {
                console.warn('loadSchema: fetch', p, 'returned', res.status);
            }
        } catch (err) {
            console.warn('loadSchema: fetch error for', p, err);
        }
    }
    return false;
}

window.selectProject = async function(value) {
    if (!value) return;
    selectedProjectId = value;
    await selectProject(value);
};

window.showImportInstructions = function() {
    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
        title: 'Panduan Import Excel HSE',
        width: '650px',
        background: isDark ? '#1A1A1A' : '#ffffff',
        color: isDark ? '#ffffff' : '#1e293b',
        html: `
            <div class="text-left text-sm mb-4 text-slate-600 dark:text-slate-400">
                <p class="mb-3">Sistem akan membaca file Excel Anda dan Anda dapat memilih kolom mana yang sesuai.</p>
                
                <div class="mb-4 overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                    <table class="w-full text-[10px] text-left border-collapse">
                        <thead class="bg-yellow-100 dark:bg-yellow-900/30 font-bold">
                            <tr>
                                <th class="p-2 border-b border-slate-200 dark:border-slate-700">No</th>
                                <th class="p-2 border-b border-slate-200 dark:border-slate-700">Jenis Laporan</th>
                                <th class="p-2 border-b border-slate-200 dark:border-slate-700">Nilai Maks</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="bg-slate-100 dark:bg-slate-800 font-bold">
                                <td class="p-2 border-b border-slate-200 dark:border-slate-700">1</td>
                                <td class="p-2 border-b border-slate-200 dark:border-slate-700">Rencana K3LP</td>
                                <td class="p-2 border-b border-slate-200 dark:border-slate-700">15</td>
                            </tr>
                            <tr>
                                <td class="p-2 border-b border-slate-100 dark:border-slate-800">a</td>
                                <td class="p-2 border-b border-slate-100 dark:border-slate-800">Sudah dibuat dan disahkan...</td>
                                <td class="p-2 border-b border-slate-100 dark:border-slate-800">5</td>
                            </tr>
                            <tr>
                                <td class="p-2 border-b border-slate-100 dark:border-slate-800">b</td>
                                <td class="p-2 border-b border-slate-100 dark:border-slate-800">Dokumen Hardcopy...</td>
                                <td class="p-2 border-b border-slate-100 dark:border-slate-800">5</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400 mb-4">
                    <strong>Penting:</strong><br>
                    - Baris <strong>Grup</strong> menggunakan angka bulat (1, 2, 3).<br>
                    - Baris <strong>Item</strong> menggunakan huruf (a, b, c).
                </div>

                <div class="flex justify-center mb-2">
                    <button onclick="downloadHSETemplate()" class="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-semibold text-xs flex items-center gap-2 transition-colors">
                        <i class="fas fa-file-excel"></i> Download Contoh Format Excel
                    </button>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-file-upload mr-2"></i> Pilih File',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#16a34a',
    }).then((result) => {
        if (result.isConfirmed) {
            document.getElementById('importExcelInput').click();
        }
    });
};

window.downloadHSETemplate = function() {
    const data = [
        { "No": 1, "Jenis Laporan": "Rencana K3LP", "Nilai Maks": 15, "Keterangan": "Contoh Baris Grup (Angka Bulat)" },
        { "No": "a", "Jenis Laporan": "Sudah dibuat dan disahkan Owner", "Nilai Maks": 5, "Keterangan": "" },
        { "No": "b", "Jenis Laporan": "Dokumen Hardcopy Sudah diserahkan ke Owner", "Nilai Maks": 5, "Keterangan": "" },
        { "No": "c", "Jenis Laporan": "RK3LP sudah dibuat tapi belum dikirimkan ke Owner", "Nilai Maks": 5, "Keterangan": "" },
        { "No": 2, "Jenis Laporan": "Simulasi/Pelatihan Tanggap Darurat", "Nilai Maks": 4, "Keterangan": "Grup Baru" },
        { "No": "a", "Jenis Laporan": "Simulasi Kebakaran/Pemakaian APAR", "Nilai Maks": 1, "Keterangan": "" },
        { "No": "b", "Jenis Laporan": "Pelatihan & Simulasi P3K", "Nilai Maks": 1, "Keterangan": "" }
    ];
    
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    const wscols = [
        {wch: 5},  // No
        {wch: 40}, // Uraian
        {wch: 10}, // Nilai Maks
        {wch: 40}  // Keterangan
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_HSE");
    XLSX.writeFile(wb, "Template_Import_HSE.xlsx");
};

window.setCategoryFilter = setCategoryFilter;
window.updateItemValue = updateItemValue;
window.toggleGroup = toggleGroup;
window.handleSearch = function(event) { handleSearch(event.target.value); };
window.updateAssessor = function(event) { updateAssessor(event.target.value); };
window.updateNotes = function(event) { updateNotes(event.target.value); };
window.handleProgressChange = function(event) { handleProgressChange(event.target.value); };
window.finalizeAssessment = finalizeAssessment;
// (placeholders removed) will attach real handlers after functions are defined in DOMContentLoaded

window.addEventListener('DOMContentLoaded', async () => {
    const projectSelect = document.getElementById('projectSelector');
    const searchInput = document.getElementById('searchInput');
    const assessorInput = document.getElementById('assessor-name');
    const notesInput = document.getElementById('assessment-notes');
    const progressInput = document.getElementById('projectProgressInput');
    const finalizeButton = document.getElementById('finalizeButton');

    if (projectSelect) projectSelect.addEventListener('change', async (event) => { await selectProject(event.target.value); });

    try {
        await loadScript('https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js');
    } catch (err) {
        console.error("Gagal memuat library XLSX. Fitur import tidak akan berfungsi.", err);
    }

    const createBtnContainer = document.getElementById('createTableBtn')?.parentNode;
    if (createBtnContainer) {
        const importBtn = document.createElement('button');
        importBtn.id = 'importExcelBtn';
        importBtn.className = 'bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg shadow-sm font-semibold transition-colors flex items-center gap-2';
        importBtn.innerHTML = '<i class="fas fa-file-import"></i> Import Excel';
        importBtn.type = 'button';
        importBtn.addEventListener('click', showImportInstructions);
        createBtnContainer.insertBefore(importBtn, document.getElementById('createTableBtn').nextSibling);

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'importExcelInput';
        fileInput.className = 'hidden';
        fileInput.accept = ".xlsx, .xls";
        fileInput.addEventListener('change', handleImportExcel);
        createBtnContainer.appendChild(fileInput);
    }

    if (searchInput) searchInput.addEventListener('input', (event) => handleSearch(event.target.value));
    if (assessorInput) assessorInput.addEventListener('input', (event) => updateAssessor(event.target.value));
    if (notesInput) notesInput.addEventListener('input', (event) => updateNotes(event.target.value));
    // Progress is read-only and controlled by project data; do not attach manual input handler
    if (finalizeButton) finalizeButton.addEventListener('click', finalizeAssessment);
    const createBtn = document.getElementById('createTableBtn');
    if (createBtn) createBtn.addEventListener('click', createEvaluationTable);
    // Modal handlers for create/edit table
    const tableModal = document.getElementById('tableModal');
    const modalAddChild = document.getElementById('modalAddChild');
    const modalChildrenList = document.getElementById('modalChildrenList');
    const modalCancel = document.getElementById('modalCancelTable');
    const modalSave = document.getElementById('modalSaveTable');

    let editingGroupId = null;

    function openCreateTableModal() {
        editingGroupId = null;
        document.getElementById('modalTableName').value = '';
        document.getElementById('modalTableDesc').value = '';
        modalChildrenList.innerHTML = '';
        addChildRowToModal();
        tableModal.classList.remove('hidden');
        tableModal.classList.add('flex');
    }

    function closeTableModal() {
        tableModal.classList.add('hidden');
        tableModal.classList.remove('flex');
    }

    function addChildRowToModal(child) {
        const idx = Date.now() + Math.random();
        const wrapper = document.createElement('div');
        wrapper.className = 'flex gap-2 items-center bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100 dark:border-slate-700';
        wrapper.dataset.rowId = idx;
        wrapper.innerHTML = `
            <input placeholder="Label child" class="flex-1 rounded-xl border border-slate-100 dark:border-slate-700 p-2 bg-white/60 dark:bg-slate-950/30 text-slate-700 dark:text-slate-200" value="${child ? escapeHtml(child.label) : ''}" />
            <input type="number" min="0" placeholder="Max" class="w-24 rounded-xl border border-slate-100 dark:border-slate-700 p-2 bg-white/60 dark:bg-slate-950/30 text-slate-700 dark:text-slate-200" value="${child ? Number(child.maxScore) : 0}" />
            <button type="button" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 remove-child">Hapus</button>
        `;
        modalChildrenList.appendChild(wrapper);
        wrapper.querySelector('.remove-child').addEventListener('click', () => wrapper.remove());
    }

    function escapeHtml(s) { return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    async function saveModalTable() {
        const name = document.getElementById('modalTableName').value.trim();
        const desc = document.getElementById('modalTableDesc').value.trim();
        if (!name) { alert('Nama tabel wajib diisi'); return; }
        const childrenEls = Array.from(modalChildrenList.children);
        if (childrenEls.length === 0) { alert('Tambahkan minimal 1 child'); return; }
        const children = childrenEls.map((el, i) => {
            const label = el.children[0].value.trim() || `Item ${i+1}`;
            const maxScore = Number(el.children[1].value) || 0;
            return { id: `item-${Date.now()}-${i}`, no: `${i+1}`, label, maxScore, keterangan: desc };
        });

        if (editingGroupId) {
            // update existing group
            const g = evaluationSchema.find(x => x.id === editingGroupId);
            if (!g) { alert('Group tidak ditemukan'); closeTableModal(); return; }
            // snapshot for history
            const prevGroup = JSON.parse(JSON.stringify(g));
            // remove old draftState items for removed children
            const oldIds = (g.children||[]).map(c => c.id);
            g.label = name; g.keterangan = desc; g.children = children;
            // remove draftState entries not in new children
            oldIds.forEach(id => { if (!children.some(c=>c.id===id)) delete draftState.items[id]; });
            // ensure draftState has entries for new children and update description
            children.forEach(c => {
                if (!draftState.items[c.id]) draftState.items[c.id] = { buktiAda: 0, buktiTidak: 0, statusAda: 0, statusTidak: 0, maxScore: Number(c.maxScore), notes:'', keterangan: desc };
                else draftState.items[c.id].keterangan = desc;
            });
            // history for edit
            pushHistory({ action: 'edit_group', target: editingGroupId, detail: { before: prevGroup, after: { id: g.id, label: g.label, children: g.children.map(c=>({ id:c.id, label:c.label })) } } });
        } else {
            // create new group
            const gid = `g-${Date.now()}`;
            const newGroup = { id: gid, label: name, keterangan: desc, children };
            evaluationSchema.push(newGroup);
            expandedGroups.add(gid);
            // add draft items and set description per item
            children.forEach(c => { draftState.items[c.id] = { buktiAda: 0, buktiTidak: 0, statusAda: 0, statusTidak: 0, maxScore: Number(c.maxScore), notes:'', keterangan: desc }; });
            // history: new group and children
            pushHistory({ action: 'add_group', target: gid, detail: { label: name, children: children.map(c=>({ id: c.id, label: c.label })) } });
        }

        renderEvaluationTable();
        queueAutoSave();
        closeTableModal();
    }

    function openEditGroupModal(groupId) {
        const g = evaluationSchema.find(x => x.id === groupId);
        if (!g) return alert('Group tidak ditemukan');
        editingGroupId = groupId;
        document.getElementById('modalTableName').value = g.label || '';
        document.getElementById('modalTableDesc').value = g.keterangan || g.description || '';
        modalChildrenList.innerHTML = '';
        (g.children||[]).forEach(c => addChildRowToModal(c));
        tableModal.classList.remove('hidden'); tableModal.classList.add('flex');
    }

    function deleteGroup(groupId) {
        const isDark = document.documentElement.classList.contains('dark');
        Swal.fire({
            title: 'Hapus group?',
            text: 'Hapus group ini beserta semua child-nya?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: isDark ? '#2A2A2A' : '#64748B',
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
            background: isDark ? '#1A1A1A' : '#ffffff',
            color: isDark ? '#ffffff' : '#1e293b'
        }).then((res) => {
            if (!res.isConfirmed) return;
                const idx = evaluationSchema.findIndex(x => x.id === groupId);
                if (idx === -1) return;
                // snapshot for undo
                const grpSnapshot = JSON.parse(JSON.stringify(evaluationSchema[idx]));
                const itemsSnapshot = {};
                (grpSnapshot.children||[]).forEach(c => { if (draftState.items[c.id]) itemsSnapshot[c.id] = JSON.parse(JSON.stringify(draftState.items[c.id])); });
                // remove
                evaluationSchema.splice(idx,1);
                if (selectedCategory === groupId) selectedCategory = 'all';
                (grpSnapshot.children||[]).forEach(c => { if (draftState.items[c.id]) delete draftState.items[c.id]; });
                // history
                pushHistory({ action: 'delete_group', target: groupId, detail: { group: grpSnapshot } });
                renderEvaluationTable();
                renderCategoryFilters();
                queueAutoSave();
                // push to trash for possible undo
                draftState.trash.groups.push({ group: grpSnapshot, index: idx, items: itemsSnapshot });
                Swal.fire({ title: 'Terhapus', text: 'Group telah dihapus.', icon: 'success', showCancelButton: true, confirmButtonText: 'Undo', cancelButtonText: 'Tutup' }).then(r => {
                    if (!r.isConfirmed) return;
                    const t = draftState.trash.groups.pop();
                    if (!t) return;
                    evaluationSchema.splice(t.index, 0, t.group);
                    Object.keys(t.items||{}).forEach(id => draftState.items[id] = t.items[id]);
                    renderEvaluationTable();
                    queueAutoSave();
                        pushHistory({ action: 'undo_delete_group', target: t.group.id, detail: { group: t.group } });
                    Swal.fire('Dikembalikan', 'Group berhasil dikembalikan.', 'success');
                });
        });
    }

    function editChild(itemId) {
        let found = null;
        for (const g of evaluationSchema) {
            const it = (g.children||[]).find(c=>c.id===itemId);
            if (it) { found = it; break; }
        }
        if (!found) return Swal.fire('Item tidak ditemukan', '', 'error');

        const isDark = document.documentElement.classList.contains('dark');
        Swal.fire({
            title: 'Ubah Item',
            html: `
                <input id="swal-label" class="swal2-input" placeholder="Label" value="${escapeHtml(found.label)}">
                <input id="swal-max" type="number" class="swal2-input" placeholder="Nilai Maks" value="${Number(found.maxScore)}">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Simpan',
            cancelButtonText: 'Batal',
            background: isDark ? '#1A1A1A' : '#ffffff',
            color: isDark ? '#ffffff' : '#1e293b',
            preConfirm: () => {
                const lbl = document.getElementById('swal-label').value.trim();
                const mx = Number(document.getElementById('swal-max').value || 0);
                if (!lbl) Swal.showValidationMessage('Label wajib diisi');
                return { label: lbl, max: mx };
            }
        }).then((result) => {
            if (!result.isConfirmed) return;
                // save previous for undo
                const prev = { label: found.label, maxScore: found.maxScore };
                draftState.trash.edits.push({ itemId, prev });
                found.label = result.value.label;
                found.maxScore = Number(result.value.max) || 0;
                if (draftState.items[itemId]) draftState.items[itemId].maxScore = found.maxScore;
                renderEvaluationTable(); queueAutoSave();
                // history
                pushHistory({ action: 'edit_item', target: itemId, detail: { before: prev, after: { label: found.label, maxScore: found.maxScore } } });
                Swal.fire({ title: 'Berhasil', text: 'Item diperbarui.', icon: 'success', showCancelButton: true, confirmButtonText: 'Undo', cancelButtonText: 'Tutup' }).then(r => {
                if (!r.isConfirmed) return;
                const last = draftState.trash.edits.pop();
                if (!last || last.itemId !== itemId) return;
                // revert
                found.label = last.prev.label;
                found.maxScore = last.prev.maxScore;
                if (draftState.items[itemId]) draftState.items[itemId].maxScore = last.prev.maxScore;
                renderEvaluationTable(); queueAutoSave();
                    pushHistory({ action: 'undo_edit_item', target: itemId, detail: { restored: last.prev } });
                Swal.fire('Dikembalikan', 'Perubahan dibatalkan.', 'success');
            });
        });
    }

    function deleteChild(itemId) {
        const isDark = document.documentElement.classList.contains('dark');
        Swal.fire({
            title: 'Hapus item?',
            text: 'Item akan dihapus dari tabel penilaian.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: isDark ? '#2A2A2A' : '#64748B',
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
            background: isDark ? '#1A1A1A' : '#ffffff',
            color: isDark ? '#ffffff' : '#1e293b'
        }).then((res) => {
            if (!res.isConfirmed) return;
                for (const g of evaluationSchema) {
                    const idx = (g.children||[]).findIndex(c=>c.id===itemId);
                    if (idx !== -1) {
                        // snapshot for undo
                        const childSnap = JSON.parse(JSON.stringify(g.children[idx]));
                        const itemState = draftState.items[itemId] ? JSON.parse(JSON.stringify(draftState.items[itemId])) : null;
                        // remove
                        g.children.splice(idx,1);
                        if (draftState.items[itemId]) delete draftState.items[itemId];
                        // history
                        pushHistory({ action: 'delete_item', target: itemId, detail: { child: childSnap, groupId: g.id } });
                        renderEvaluationTable(); queueAutoSave();
                        draftState.trash.children.push({ groupId: g.id, child: childSnap, index: idx, itemState });
                        Swal.fire({ title: 'Terhapus', text: 'Item telah dihapus.', icon: 'success', showCancelButton: true, confirmButtonText: 'Undo', cancelButtonText: 'Tutup' }).then(r => {
                            if (!r.isConfirmed) return;
                            const last = draftState.trash.children.pop();
                            if (!last || last.child.id !== itemId) return;
                            const parent = evaluationSchema.find(x => x.id === last.groupId);
                            if (!parent) {
                                // if parent group missing, re-add group at end
                                evaluationSchema.push({ id: last.groupId, label: 'Restored Group', children: [ last.child ] });
                            } else {
                                parent.children.splice(last.index, 0, last.child);
                            }
                            if (last.itemState) draftState.items[itemId] = last.itemState;
                            renderEvaluationTable(); queueAutoSave();
                            pushHistory({ action: 'undo_delete_item', target: itemId, detail: { child: last.child, groupId: last.groupId } });
                            Swal.fire('Dikembalikan', 'Item berhasil dikembalikan.', 'success');
                        });
                        return;
                    }
                }
                Swal.fire('Item tidak ditemukan', '', 'error');
        });
    }

    if (modalAddChild) modalAddChild.addEventListener('click', () => addChildRowToModal());
    if (modalCancel) modalCancel.addEventListener('click', () => closeTableModal());
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => closeTableModal());
    if (modalSave) modalSave.addEventListener('click', () => saveModalTable());
    // expose handlers so inline onclick="window.openEditGroupModal(...)" works
    window.openEditGroupModal = openEditGroupModal;
    window.deleteGroup = deleteGroup;
    window.editChild = editChild;
    window.deleteChild = deleteChild;
    // attach open modal to create button (override previous behavior)
    if (createBtn) createBtn.removeEventListener('click', createEvaluationTable);
    if (createBtn) createBtn.addEventListener('click', openCreateTableModal);
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark');
        Swal.fire({
            title: 'Kosongkan Riwayat?',
            text: 'Semua entri riwayat akan dihapus. Tindakan ini tidak dapat dibatalkan.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: isDark ? '#2A2A2A' : '#64748B',
            confirmButtonText: 'Kosongkan',
            cancelButtonText: 'Batal',
            background: isDark ? '#1A1A1A' : '#ffffff',
            color: isDark ? '#ffffff' : '#1e293b'
        }).then((res) => {
            if (!res.isConfirmed) return;
            draftState.history = [];
            renderHistory();
            queueAutoSave();
            Swal.fire({ title: 'Berhasil', text: 'Riwayat perubahan dikosongkan.', icon: 'success', background: isDark ? '#1A1A1A' : '#ffffff', color: isDark ? '#ffffff' : '#1e293b' });
        });
    });

    await init();
});