import { getProjects, getTestimonials, getNews, getClients, getGallery } from './firebase-service.js';

// Initialize AOS (Animate On Scroll)
if (typeof AOS !== 'undefined') {
    AOS.init({
        duration: 800,
        offset: 100,
        once: true,
        easing: 'ease-in-out-cubic'
    });
}

// Navbar Scroll Effect
const navbar = document.querySelector('.navbar');
const scrollProgressBar = document.querySelector('.scroll-progress');

window.addEventListener('scroll', () => {
    if (scrollProgressBar) {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        scrollProgressBar.style.width = scrollPercent + '%';
    }
    
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
});

// Smooth Scroll for Navbar Links
document.querySelectorAll('.navbar-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
            
            // Tutup menu mobile otomatis setelah link diklik
            if (window.innerWidth < 1280 && typeof window.toggleMobileMenu === 'function') {
                const navbarMenu = document.querySelector('.navbar-menu');
                if (navbarMenu && !navbarMenu.classList.contains('-translate-x-full') && !navbarMenu.classList.contains('translate-x-full')) {
                    window.toggleMobileMenu();
                }
            }
        }
    });
});

// Counter Animation
function animateCounters() {
    const counters = document.querySelectorAll('[data-target]');
    const duration = 2000; // 2 seconds
    const frameRate = 30;
    const frames = duration / (1000 / frameRate);

    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const increment = target / frames;
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.ceil(current) + (counter.textContent.includes('+') ? '+' : '');
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target + (counter.textContent.includes('+') ? '+' : '');
            }
        };

        updateCounter();
    });
}

// Trigger counter animation when hero section is visible
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            heroObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroSection = document.querySelector('#hero');
if (heroSection) {
    heroObserver.observe(heroSection);
}

// Navbar Mobile Toggle
const navbarToggle = document.querySelector('.navbar-toggle');
const navbarMenu = document.querySelector('.navbar-menu');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
const closeMenuBtn = document.getElementById('closeMenuBtn');

window.toggleMobileMenu = function() {
    if (navbarMenu && mobileMenuOverlay) {
        const isClosed = navbarMenu.classList.contains('-translate-x-full');
        if (isClosed) {
            document.body.classList.add('overflow-hidden'); // Kunci scroll body
            mobileMenuOverlay.classList.remove('hidden');
            setTimeout(() => mobileMenuOverlay.classList.remove('opacity-0'), 10);
            navbarMenu.classList.remove('-translate-x-full');
            // Ganti ikon hamburger menjadi 'X' saat menu terbuka
            if (navbarToggle) navbarToggle.innerHTML = '<i class="fas fa-times text-2xl"></i>';
        } else {
            document.body.classList.remove('overflow-hidden'); // Buka kunci scroll body
            mobileMenuOverlay.classList.add('opacity-0');
            // Menggeser kembali ke arah kiri saat ditutup
            navbarMenu.classList.add('-translate-x-full');
            setTimeout(() => mobileMenuOverlay.classList.add('hidden'), 300);
            // Ganti ikon kembali menjadi hamburger
            if (navbarToggle) navbarToggle.innerHTML = '<i class="fas fa-bars text-2xl"></i>';
        }
    }
}

if (navbarToggle) navbarToggle.addEventListener('click', window.toggleMobileMenu);
if (closeMenuBtn) closeMenuBtn.addEventListener('click', window.toggleMobileMenu);
if (mobileMenuOverlay) mobileMenuOverlay.addEventListener('click', window.toggleMobileMenu);

// Menangani state menu dan visibilitas tombol hamburger saat ukuran layar berubah
const handleResize = () => {
    if (navbarMenu && navbarToggle) {
        if (window.innerWidth >= 1280) {
            // Sembunyikan tombol hamburger di resolusi desktop
            navbarToggle.classList.add('hidden');

            // Pastikan menu mobile (sidebar) tertutup saat layar diperbesar
            const isMenuOpen = !navbarMenu.classList.contains('-translate-x-full');
            if (isMenuOpen) {
                window.toggleMobileMenu();
            }
        } else {
            // Tampilkan kembali tombol hamburger di resolusi mobile
            navbarToggle.classList.remove('hidden');
        }
    }
};
window.addEventListener('resize', handleResize);
handleResize(); // Jalankan saat load pertama untuk mengatur state awal

// Swipe to close functionality
let touchStartX = 0;
let touchEndX = 0;

function handleSwipe() {
    if (touchStartX - touchEndX > 50) { // Swipe ke Kiri
        if (navbarMenu && navbarMenu.classList.contains('translate-x-0')) {
            window.toggleMobileMenu();
        }
    }
}

const touchStart = e => touchStartX = e.changedTouches[0].screenX;
const touchEnd = e => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); };

if (mobileMenuOverlay) { mobileMenuOverlay.addEventListener('touchstart', touchStart, {passive: true}); mobileMenuOverlay.addEventListener('touchend', touchEnd, {passive: true}); }
if (navbarMenu) { navbarMenu.addEventListener('touchstart', touchStart, {passive: true}); navbarMenu.addEventListener('touchend', touchEnd, {passive: true}); }

// CTA Buttons
document.querySelectorAll('.navbar-cta, .btn-primary, .btn-secondary, a, button').forEach(btn => {
    const text = btn.textContent.toLowerCase();
    
    if (text.includes('hubungi') || text.includes('konsultasi')) {
        btn.addEventListener('click', () => {
                window.location.href = 'kontak.html';
        });
    } else if (text.includes('portofolio')) {
        btn.addEventListener('click', () => { // Corrected: This was part of the previous fix, keeping it.
            const target = document.querySelector('#portfolio');
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    } else if (text.includes('klien') || text.includes('mitra') || text.includes('login')) {
        btn.addEventListener('click', (e) => {
            if (btn.tagName === 'A' && (!btn.getAttribute('href') || btn.getAttribute('href') === '#')) e.preventDefault();
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        });
    }
});

// Form Submission
const contactForm = document.querySelector('#contact form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        // Simple validation
        if (!data.name || !data.email || !data.message) {
            alert('Mohon isi semua field yang wajib diisi');
            return;
        }
        
        // Show success message
        alert('Terima kasih! Pesan Anda telah kami terima. Kami akan menghubungi Anda segera.');
        contactForm.reset();
    });
}

// Parallax Effect on Hero
window.addEventListener('scroll', () => {
    const heroBg = document.querySelector('.hero-video-bg');
    if (heroBg && window.scrollY < window.innerHeight) {
        heroBg.style.transform = `translateY(${window.scrollY * 0.5}px)`;
    }
});

// Lazy Loading untuk Images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Add animation for service cards on hover
document.querySelectorAll('.services-card, .portfolio-item, .project-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });
});

// Navbar menu active state on scroll
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.navbar-menu a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            link.classList.remove('text-corporate-bright');
            if (href.slice(1) === current) {
                link.classList.add('text-corporate-bright');
            }
        }
    });
});

// Preloader/Loading Screen
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// Performance monitoring
if (window.performance && window.performance.timing) {
    const navigation = window.performance.timing;
    const loadTime = navigation.loadEventEnd - navigation.navigationStart;
    console.log(`Page load time: ${loadTime}ms`);
}

// Add to cart / CTA tracking
document.querySelectorAll('[class*="btn-"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        console.log(`Button clicked: ${btn.textContent.trim()}`);
    });
});

// Initialize tooltips if needed
function initTooltips() {
    document.querySelectorAll('[title]').forEach(el => {
        el.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('title');
            tooltip.style.cssText = `
                position: absolute;
                background: #0B1F3A;
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 1000;
            `;
            document.body.appendChild(tooltip);
        });
    });
}

initTooltips();

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Tutup sidebar menu jika sedang terbuka
        if (navbarMenu && !navbarMenu.classList.contains('-translate-x-full')) {
            window.toggleMobileMenu();
        }
    }
});

console.log('MEGATAMA Website Loaded Successfully');

// --- Firebase Integration for Testimonials ---
async function loadTestimonials() {
    const wrapper = document.getElementById('testimonialWrapper');
    if (!wrapper) return;

    try {
        wrapper.innerHTML = '<div class="swiper-slide"><div class="flex justify-center py-10"><i class="fas fa-spinner fa-spin text-3xl text-orange-500"></i></div></div>';

        const testimonials = await getTestimonials();

        if (testimonials.length === 0) {
            wrapper.innerHTML = '<div class="swiper-slide"><div class="text-center text-zinc-500 py-10">Belum ada testimoni.</div></div>';
            return;
        }

        wrapper.innerHTML = testimonials.map(t => {
            // Fallback avatar jika tidak ada imageUrl
            const avatar = t.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name || 'User')}&background=0B1F3A&color=fff`;
            const rating = t.rating || 5;
            // Menghasilkan output bintang sesuai rating
            const stars = Array(5).fill(0).map((_, i) => `<i class="fas fa-star ${i < rating ? 'text-yellow-400' : 'text-gray-300'}"></i>`).join('');
            
            return `
            <div class="swiper-slide">
                <div class="bg-white rounded-xl shadow-lg p-8 h-full">
                    <div class="flex items-center mb-4">
                        <img src="${avatar}" alt="${t.name}" class="w-14 h-14 rounded-full mr-4 object-cover">
                        <div>
                            <h4 class="font-bold text-corporate-dark">${t.name}</h4>
                            <p class="text-sm text-gray-600">${t.position}</p>
                        </div>
                    </div>
                    <div class="flex gap-1 mb-4">
                        ${stars}
                    </div>
                    <p class="text-gray-700">"${t.message}"</p>
                </div>
            </div>`;
        }).join('');

        // Initialize Swiper SETELAH elemen DIMUAT
        if (typeof Swiper !== 'undefined') {
            new Swiper('.testimonialSwiper', {
                loop: testimonials.length > 1, // Loop hanya jika > 1
                autoplay: { delay: 5000, disableOnInteraction: false },
                slidesPerView: 1,
                spaceBetween: 20,
                pagination: { el: '.swiper-pagination', clickable: true, type: 'bullets' },
                breakpoints: {
                    768: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 },
                },
            });
        }
    } catch (error) {
        console.error("Error loading testimonials:", error);
        wrapper.innerHTML = '<div class="swiper-slide"><div class="text-center text-red-500 py-10">Gagal memuat data testimoni.</div></div>';
    }
}

// --- Firebase Integration for News ---
async function loadNews() {
    const container = document.getElementById('publicNewsGrid');
    if (!container) return;

    try {
        container.innerHTML = '<div class="col-span-full text-center py-10"><i class="fas fa-spinner fa-spin text-3xl text-orange-500"></i><p class="mt-3 text-zinc-500">Memuat artikel terbaru...</p></div>';

        const newsList = await getNews();

        if (newsList.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-zinc-500 py-10">Belum ada berita atau artikel yang diterbitkan.</div>';
            return;
        }

        // Tampilkan 3 berita terbaru
        const showcasedNews = newsList.slice(0, 3);

        container.innerHTML = showcasedNews.map((n, index) => {
            const cover = n.imageUrl || 'https://placehold.co/400x250/0B1F3A/FFFFFF?text=Berita';
            const delay = index * 100; // Untuk animasi AOS
            
            return `
            <div class="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col h-full" data-aos="fade-up" data-aos-delay="${delay}">
                <div class="relative h-48 overflow-hidden shrink-0">
                    <img src="${cover}" alt="News" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
                    <span class="absolute top-4 right-4 ${n.category === 'Artikel' ? 'bg-gray-500' : 'bg-corporate-bright'} text-white px-4 py-1 rounded-full text-xs font-semibold">${n.category || 'Berita'}</span>
                </div>
                <div class="p-6 flex-1 flex flex-col">
                    <p class="text-xs text-gray-500 mb-2"><i class="fas fa-calendar mr-2"></i>${n.date || '-'}</p>
                    <h3 class="text-xl font-bold text-corporate-dark mb-3 line-clamp-2">${n.title}</h3>
                    <p class="text-gray-700 mb-4 line-clamp-3 flex-1">${n.content}</p>
                    <a href="detail-berita.html?id=${n.id}" class="text-corporate-bright font-semibold hover:text-corporate-dark transition-colors text-left mt-auto inline-block">Baca Selengkapnya <i class="fas fa-arrow-right ml-2"></i></a>
                </div>
            </div>`;
        }).join('');
        
        setTimeout(() => { if (typeof AOS !== 'undefined') AOS.refresh(); }, 100);
    } catch (error) {
        console.error("Error loading news:", error);
        container.innerHTML = '<div class="col-span-full text-center text-red-500 py-10">Gagal memuat berita dari server.</div>';
    }
}

// --- Firebase Integration for Clients ---
async function loadClients() {
    const wrapper = document.getElementById('clientWrapper');
    if (!wrapper) return;

    try {
        const clients = await getClients();

        if (clients.length === 0) {
            wrapper.innerHTML = '<div class="swiper-slide"><div class="text-center text-zinc-500 py-10">Belum ada logo klien yang diunggah.</div></div>';
            return;
        }

        wrapper.innerHTML = clients.map(c => `
            <div class="swiper-slide">
                <div class="flex items-center justify-center h-32 bg-corporate-light rounded-lg hover:shadow-lg transition-shadow p-4">
                    <img src="${c.logoUrl}" alt="${c.name}" title="${c.name}" class="w-20 h-20 rounded-full object-cover mx-auto filter grayscale hover:grayscale-0 transition-all duration-300 shadow-sm border border-gray-200">
                </div>
            </div>
        `).join('');

        // Initialize Swiper for Clients setelah elemennya selesai di-render
        if (typeof Swiper !== 'undefined') {
            new Swiper('.clientsSwiper', {
                loop: clients.length > 4, // Loop hanya jika datanya mencukupi untuk menghindari glitch visual
                autoplay: {
                    delay: 3000,
                    disableOnInteraction: false,
                },
                slidesPerView: 2,
                spaceBetween: 20,
                breakpoints: {
                    640: { slidesPerView: 3 },
                    1024: { slidesPerView: 5 },
                },
            });
        }
    } catch (error) {
        console.error("Error loading clients:", error);
    }
}

// --- Firebase Integration for Gallery/Portfolio ---
async function loadGallery() {
    const container = document.getElementById('portfolioGrid');
    if (!container) return;

    try {
        container.innerHTML = '<div class="col-span-full text-center py-10"><i class="fas fa-spinner fa-spin text-3xl text-orange-500"></i><p class="mt-3 text-zinc-500">Memuat portofolio...</p></div>';

        const gallery = await getGallery();

        if (gallery.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-zinc-500 py-10">Belum ada foto portofolio yang diunggah.</div>';
            return;
        }

        container.innerHTML = gallery.map((g, index) => {
            const delay = (index % 3) * 100;
            return `
            <div class="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer" data-aos="zoom-in" data-aos-delay="${delay}">
                <img src="${g.imageUrl}" alt="${g.title}" class="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <h3 class="text-xl font-bold text-white mb-2">${g.title}</h3>
                    <p class="text-gray-200 text-sm">${g.project} | ${g.date}</p>
                </div>
            </div>`;
        }).join('');

        setTimeout(() => { if (typeof AOS !== 'undefined') AOS.refresh(); }, 100);
    } catch (error) {
        console.error("Error loading gallery:", error);
        container.innerHTML = '<div class="col-span-full text-center text-red-500 py-10">Gagal memuat data portofolio dari server.</div>';
    }
}

// --- Firebase Integration for Public Projects ---
async function loadPublicProjects() {
    const container = document.getElementById('publicProjectsGrid');
    if (!container) return; // Hentikan jika tidak ada container di halaman ini

    try {
        container.innerHTML = '<div class="col-span-full text-center py-10"><i class="fas fa-spinner fa-spin text-3xl text-orange-500"></i><p class="mt-3 text-zinc-500">Memuat data proyek...</p></div>';

        const projects = await getProjects();
        
        if (projects.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-zinc-500 py-10">Belum ada proyek yang dipublikasikan.</div>';
            return;
        }

        // Urutkan berdasarkan progress (tertinggi) untuk menampilkan proyek 'Terbaik'
        const sortedProjects = projects.sort((a, b) => (b.progress || 0) - (a.progress || 0));

        // Update Teks Subtitle agar sinkron dengan jumlah yang ditampilkan
        const subtitle = document.getElementById('projectsSubtitle');
        if (subtitle) {
            subtitle.textContent = `${sortedProjects.length} Proyek Terbaik dengan Nilai Signifikan`;
        }

        container.innerHTML = sortedProjects.map(p => {
            const coverImage = p.imageUrl || 'https://images.unsplash.com/photo-1541888086925-ebbc31bc0888?w=800';
            const progressColor = p.progress === 100 ? 'bg-green-500' : (p.progress > 0 ? 'bg-blue-500' : 'bg-orange-500');
            const statusTextColor = p.status === 'Selesai' ? 'text-green-600' : (p.status === 'Berjalan' ? 'text-blue-600' : 'text-orange-600');

            return `
            <div class="group relative rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 project-card h-[380px] flex flex-col" data-aos="fade-up">
                <img src="${coverImage}" alt="${p.name}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 z-0">
                <div class="absolute inset-0 bg-gradient-to-t from-corporate-dark via-corporate-dark/80 to-transparent z-0 group-hover:via-corporate-dark/90 transition-colors"></div>
                
                <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold ${statusTextColor} shadow-sm z-10">${p.status}</div>
                
                <div class="p-6 flex flex-col flex-1 relative z-10 justify-end">
                    <h3 class="text-2xl font-bold text-white group-hover:text-corporate-bright transition-colors line-clamp-2 mb-2 drop-shadow-md">${p.name}</h3>
                    <p class="text-sm text-gray-200 mb-4 drop-shadow-md"><i class="fas fa-map-marker-alt text-corporate-bright mr-2"></i>${p.location}</p>
                    
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-xs text-gray-300 font-semibold uppercase tracking-wider">Progress Tahap Pembangunan</span>
                        <span class="text-sm font-bold text-white shrink-0">${p.progress || 0}%</span>
                    </div>
                    <div class="w-full bg-white/20 rounded-full h-2 mb-6 backdrop-blur-sm overflow-hidden">
                        <div class="${progressColor} h-full rounded-full shadow-[0_0_10px_currentColor]" style="width: ${p.progress || 0}%"></div>
                    </div>
                    
                    <a href="detail-proyek.html?id=${p.id}" class="block text-center w-full bg-corporate-bright/90 backdrop-blur hover:bg-corporate-bright text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-corporate-bright/40 mt-auto transform translate-y-2 opacity-90 group-hover:translate-y-0 group-hover:opacity-100">
                        Lihat Detail Proyek <i class="fas fa-arrow-right ml-1"></i>
                    </a>
                </div>
            </div>
            `;
        }).join('');
        
        setTimeout(() => { if (typeof AOS !== 'undefined') AOS.refresh(); }, 100);
    } catch (error) {
        console.error("Error loading public projects:", error);
        container.innerHTML = '<div class="col-span-full text-center text-red-500 py-10">Gagal memuat data proyek dari server.</div>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadPublicProjects(); // Re-enable loading of projects from DB
    loadTestimonials();
    loadNews();
    loadClients();
    loadGallery();
});
