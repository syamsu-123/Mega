import { getProjectById } from './firebase-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Mengambil Parameter ID dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (!projectId) {
        window.location.href = 'index.html#projects'; // Kembalikan ke beranda jika tidak ada ID
        return;
    }

    const project = await getProjectById(projectId);
    
    const loadingIndicator = document.getElementById('loading-indicator');
    const projectContainer = document.getElementById('project-container');

    if (!project) {
        if (loadingIndicator) {
            loadingIndicator.innerHTML = `
                <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <h2 class="text-2xl font-bold text-gray-800">Proyek Tidak Ditemukan</h2>
                <p class="text-gray-500 mt-2 mb-6">Data proyek yang Anda cari tidak ada atau URL tidak valid.</p>
                <a href="index.html#projects" class="bg-corporate-bright text-white px-6 py-2.5 rounded-lg hover:bg-orange-700 transition-colors">Kembali ke Beranda</a>
            `;
        }
        return;
    }

    // Menyembunyikan loading dan menampilkan UI
    if (loadingIndicator) loadingIndicator.classList.add('hidden');
    if (projectContainer) projectContainer.classList.remove('hidden');

    document.title = project.name + ' - Detail Proyek';
    document.getElementById('proj-title').textContent = project.name;
    document.getElementById('proj-client').textContent = project.client;
    document.getElementById('proj-location').textContent = project.location;
    document.getElementById('proj-start').textContent = project.start;
    document.getElementById('proj-end').textContent = project.end;
    document.getElementById('proj-pic').textContent = project.pic || 'Tidak Ditentukan';
    document.getElementById('proj-value').textContent = project.value || 'Tidak Ditentukan';
    
    // Pewarnaan Status
    const statusEl = document.getElementById('proj-status');
    statusEl.textContent = project.status;
    if (project.status === 'Selesai') { statusEl.classList.add('bg-green-100', 'text-green-700'); }
    else if (project.status === 'Berjalan') { statusEl.classList.add('bg-orange-100', 'text-orange-700'); }
    else { statusEl.classList.add('bg-orange-100', 'text-orange-700'); }

    // Progress Keseluruhan
    document.getElementById('proj-progress-text').textContent = project.progress + '%';
    const progressBar = document.getElementById('proj-progress-bar');
    progressBar.style.width = project.progress + '%';
    progressBar.classList.add(project.progress === 100 ? 'bg-green-500' : (project.progress > 0 ? 'bg-orange-500' : 'bg-orange-500'));

    // Tampilkan Gambar
    if (project.imageUrl) {
        const imgEl = document.getElementById('proj-image');
        imgEl.src = project.imageUrl;
        imgEl.classList.remove('hidden');
    }

    // Tampilkan Deskripsi
    document.getElementById('proj-description').innerHTML = project.description ? project.description.replace(/\n/g, '<br>') : '<span class="text-gray-400 italic">Deskripsi untuk proyek ini belum tersedia.</span>';

    // Render Daftar Tasks (Tugas/Tahapan)
    document.getElementById('proj-tasks').innerHTML = (project.tasks || []).map(t => {
        const color = t.p === 100 ? 'bg-green-500' : (t.p > 0 ? 'bg-orange-500' : 'bg-gray-300');
        return `
        <div>
            <div class="flex justify-between text-sm mb-1.5"><span class="font-semibold text-gray-700">${t.name}</span><span class="font-bold text-gray-600">${t.p}%</span></div>
            <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden"><div class="${color} h-full rounded-full transition-all duration-1000" style="width: ${t.p}%"></div></div>
        </div>`;
    }).join('');

    // Tampilkan Portofolio Lapangan
    let projectGallery = [];
    if (project.weeklyUpdates) {
        Object.keys(project.weeklyUpdates).forEach(w => {
            const update = project.weeklyUpdates[w];
            if (update.photos && update.photos.length > 0) {
                update.photos.forEach(photo => {
                    projectGallery.push({ url: photo.url, title: `Minggu ${w}`, timestamp: update.timestamp || 0 });
                });
            }
        });
    }
    projectGallery.sort((a, b) => b.timestamp - a.timestamp);
    
    const galleryContainer = document.getElementById('proj-field-gallery');
    if (galleryContainer) {
        if (projectGallery.length > 0) {
            galleryContainer.innerHTML = projectGallery.slice(0, 6).map(g => `
                <div class="aspect-square rounded-xl overflow-hidden relative group shadow-sm border border-gray-100">
                    <img src="${g.url}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="${g.title}">
                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p class="text-white text-[10px] font-semibold drop-shadow-md">${g.title}</p>
                    </div>
                </div>
            `).join('');
        } else {
            galleryContainer.innerHTML = '<div class="col-span-2 text-center text-gray-400 text-sm py-4 italic">Belum ada dokumentasi.</div>';
        }
    }
});