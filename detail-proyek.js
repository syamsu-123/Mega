import { getProjectById } from './firebase-service.js';

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

window.viewPhotoGallery = function(photos, startIndex) {
    if (typeof Swal === 'undefined' || typeof Swiper === 'undefined') {
        console.error('Swal or Swiper not loaded. Cannot open gallery.');
        // Fallback to opening the single image
        if (photos && photos[startIndex]) {
            window.open(photos[startIndex].url, '_blank');
        }
        return;
    }
    
    const swiperSlides = photos.map(photo => `
        <div class="swiper-slide flex items-center justify-center">
            <figure class="relative flex items-center justify-center max-w-[50vw] max-h-[60vh] md:max-w-[50vw] md:max-h-[60vh] sm:max-w-[75vw] sm:max-h-[75vh]">
                <img src="${photo.url}" class="w-full h-full object-contain rounded-xl shadow-2xl">
                ${photo.title ? `<figcaption class="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">${photo.title}</figcaption>` : ''}
            </figure>
        </div>
    `).join('');

    const swalHtml = `
    <div class="swiper photo-gallery-swiper w-screen h-screen group">
        <div class="swiper-wrapper">
            ${swiperSlides}
        </div>
        <!-- Add Arrows -->
        <div class="swiper-button-prev custom-nav-btn"><i class="fas fa-chevron-left"></i></div>
        <div class="swiper-button-next custom-nav-btn"><i class="fas fa-chevron-right"></i></div>
    </div>
    `;

    Swal.fire({
        html: swalHtml,
        width: '100%',
        heightAuto: false,
        padding: '0',
        margin: '0',
        background: 'transparent',
        backdrop: `rgba(0,0,0,0.9)`,
        showConfirmButton: false,
        showCloseButton: true,
        showClass: {
            popup: 'swal2-show-custom' // Custom animation class
        },
        customClass: {
            popup: 'p-0 m-0 bg-transparent',
            closeButton: 'text-white text-3xl top-4 right-4 hover:text-gray-300'
        },
        didOpen: () => {
            new Swiper('.photo-gallery-swiper', {
                loop: photos.length > 1,
                initialSlide: startIndex,
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                keyboard: {
                    enabled: true,
                },
            });
        }
    });
};

window.viewAllWeekPhotos = function(photosJson) {
    const photos = JSON.parse(decodeURIComponent(photosJson));
    const isDark = document.documentElement.classList.contains('dark');

    let html = '<div id="all-photos-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4 max-h-[70vh] overflow-y-auto p-1">';
    photos.forEach((ph, index) => {
        html += `
            <div class="aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-[#2A2A2A] relative group cursor-pointer" data-index="${index}">
                <img src="${ph.url}" class="w-full h-full object-cover group-hover:scale-110 transition-transform">
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <i class="fas fa-expand text-white text-2xl"></i>
                </div>
            </div>
        `;
    });
    html += '</div>';

    Swal.fire({
        title: 'Semua Dokumentasi Minggu Ini',
        html: html,
        width: '90%',
        maxWidth: '1000px',
        background: isDark ? '#1A1A1A' : '#ffffff',
        color: isDark ? '#ffffff' : '#1e293b',
        showConfirmButton: false,
        showCloseButton: true,
        didOpen: () => {
            document.getElementById('all-photos-grid').querySelectorAll('[data-index]').forEach(el => {
                el.addEventListener('click', () => {
                    const clickedIndex = parseInt(el.dataset.index, 10);
                    // Close the current Swal before opening the new one
                    Swal.close();
                    // Use a timeout to let the first Swal close properly
                    setTimeout(() => {
                        window.viewPhotoGallery(photos, clickedIndex);
                    }, 200);
                });
            });
        }
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    // Memastikan SweetAlert2 dan Swiper.js sudah dimuat sebelum digunakan
    try {
        await Promise.all([
            loadScript('https://cdn.jsdelivr.net/npm/sweetalert2@11'),
            loadScript('https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js')
        ]);
        // Tambahkan CSS untuk Swiper
        const swiperCss = document.createElement('link');
        swiperCss.rel = 'stylesheet';
        swiperCss.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';
        document.head.appendChild(swiperCss);

        // Inject custom styles for the lightbox and Swiper navigation
        // Custom styles for Swiper are now in src/css/detail-proyek.css
    } catch (error) {
         console.error("Gagal memuat SweetAlert2 atau Swiper. Fitur popup gambar tidak akan berfungsi.", error);
    }



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
    
    // Pengecekan role pengguna untuk menyembunyikan nilai proyek bagi Viewer
    const userRole = sessionStorage.getItem('userRole') || 'Viewer';
    const valueElement = document.getElementById('proj-value');
    if (userRole === 'Viewer') {
        if (valueElement && valueElement.parentElement) {
            valueElement.parentElement.style.display = 'none';
        }
    } else {
        valueElement.textContent = project.value || 'Tidak Ditentukan';
    }
    
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
    if (document.getElementById('proj-tasks')) {
        document.getElementById('proj-tasks').innerHTML = (project.tasks || []).map(t => {
            const color = t.p === 100 ? 'bg-green-500' : (t.p > 0 ? 'bg-orange-500' : 'bg-gray-300');
            return `
            <div>
                <div class="flex justify-between text-sm mb-1.5"><span class="font-semibold text-gray-700">${t.name}</span><span class="font-bold text-gray-600">${t.p}%</span></div>
                <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden"><div class="${color} h-full rounded-full transition-all duration-1000" style="width: ${t.p}%"></div></div>
            </div>`;
        }).join('');
    }

    // Tampilkan Portofolio Lapangan
    const galleryContainer = document.getElementById('proj-field-gallery');
    if (galleryContainer) {
        const groupedGallery = {};
        if (project.weeklyUpdates) {
            // Mengelompokkan foto berdasarkan minggu
            Object.keys(project.weeklyUpdates).forEach(w => {
                const update = project.weeklyUpdates[w];
                if (update.photos && update.photos.length > 0) {
                    if (!groupedGallery[w]) {
                        groupedGallery[w] = [];
                    }
                    update.photos.forEach(photo => {
                        // Menggunakan judul dari foto jika ada, jika tidak buat judul default
                        groupedGallery[w].push({ url: photo.url, title: `Dokumentasi Minggu ${w}` });
                    });
                }
            });
        }

        // Urutkan minggu dari yang terbaru (terbesar) ke terlama (terkecil)
        const sortedWeeks = Object.keys(groupedGallery).map(Number).sort((a, b) => b - a);

        if (sortedWeeks.length > 0) {
            let htmlContent = '';
            sortedWeeks.forEach(week => {
                const allPhotos = groupedGallery[week];
                const photosToShow = allPhotos.slice(0, 3); // Tampilkan 3 gambar pertama
                const remainingCount = allPhotos.length - photosToShow.length;

                let seeAllButton = '';
                if (remainingCount > 0) {
                    const photosJson = encodeURIComponent(JSON.stringify(allPhotos));
                    seeAllButton = `<button onclick="window.viewAllWeekPhotos('${photosJson}')" class="text-sm font-semibold text-corporate-bright hover:text-orange-700 transition-colors">Lihat ${remainingCount} lainnya <i class="fas fa-arrow-right text-xs ml-1"></i></button>`;
                }

                htmlContent += `
                <div class="col-span-full mt-8">
                    <div class="flex justify-between items-center border-b border-gray-200 pb-2 mb-4">
                        <h4 class="text-lg font-bold text-gray-800">Minggu ke-${week}</h4>
                        ${seeAllButton}
                    </div>
                    
                    <!-- Simple Image Grid -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${photosToShow.map((g, index) => `
                            <div class="aspect-[4/3] rounded-xl overflow-hidden relative group shadow-sm border border-gray-100 cursor-pointer" data-gallery-week="${week}" data-index="${index}">
                                <img src="${g.url}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="${g.title}">
                                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <i class="fas fa-expand text-white text-2xl drop-shadow-lg"></i>
                                </div>
                                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                    <p class="text-white text-[10px] font-semibold drop-shadow-md">${g.title}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                `;
            });

            galleryContainer.innerHTML = htmlContent;

            // Tambahkan event listener untuk membuka galeri foto
            galleryContainer.querySelectorAll('[data-gallery-week]').forEach(el => {
                el.addEventListener('click', () => {
                    const week = el.dataset.galleryWeek;
                    const clickedIndex = parseInt(el.dataset.index, 10);
                    const photosForGallery = groupedGallery[week];
                    window.viewPhotoGallery(photosForGallery, clickedIndex);
                });
            });

        } else {
            galleryContainer.innerHTML = '<div class="col-span-full text-center text-gray-400 text-sm py-4 italic">Belum ada dokumentasi.</div>';
        }
    }
});
