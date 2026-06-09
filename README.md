# MEGATAMA - Premium Corporate Construction & Engineering Website

## 🏢 Deskripsi Proyek

Website perusahaan konstruksi dan engineering kelas enterprise dengan desain premium, animasi smooth, dan fully responsive. Dibangun menggunakan HTML5, CSS3 (Tailwind), JavaScript vanilla, tanpa backend atau PHP.

## ✨ Fitur Utama

### 🎨 Desain
- **Premium Corporate Design** - Desain modern dengan nuansa profesional
- **Color Scheme** - Biru tua (#0B1F3A), Biru terang (#1E88E5), Putih, Abu-abu, Aksen Emas
- **Fully Responsive** - Optimal di Mobile, Tablet, Laptop, Desktop 4K
- **SEO Friendly** - Meta tags, semantic HTML, structured data

### 🚀 Teknologi & Library
- **HTML5** - Semantic markup
- **CSS3** - Tailwind CSS untuk styling modern
- **JavaScript** - Vanilla JS tanpa framework (untuk performa optimal)
- **Animasi**:
  - AOS (Animate On Scroll) - Smooth fade in/out animations
  - Swiper.js - Touch-friendly slider untuk portfolio & testimoni
  - Custom CSS animations - Parallax, hover effects
- **Icons** - Font Awesome 6.5.1
- **Performance** - Optimized images, lazy loading, smooth scrolling

### 📄 13 Sections Utama

1. **Navbar** - Sticky dengan blur effect, smooth scroll navigation
2. **Hero** - Full screen dengan counter animation dan CTA buttons
3. **About Us** - Company profile dengan visi, misi, dan 4 core values
4. **Business Division** - 6 bidang usaha dengan icon dan hover animation
5. **Services** - 6 layanan unggulan dengan glassmorphism design
6. **Portfolio** - Masonry gallery dengan kategori filter & lightbox
7. **Project Showcase** - 6 proyek unggulan dengan progress bar
8. **Company Strength** - 4 keunggulan perusahaan dengan counter
9. **Clients** - Logo slider otomatis infinite scroll
10. **Testimonial** - Slider dengan rating bintang & foto klien
11. **News** - 3 artikel terbaru dengan hover animation
12. **CTA** - Call-to-action section dengan 2 tombol
13. **Contact & Footer** - Form kontak + info + Google Maps + social media

## 📦 Instalasi & Setup

### Prerequisites
- Node.js 16+ dan npm

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Server akan berjalan di `http://localhost:3000`

### Build untuk Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🎯 Struktur Project

```
CORPORATE_COMPANY_PROFILE/
├── src/
│   ├── css/
│   │   └── style.css          # Main stylesheet
│   ├── js/
│   │   └── main.js            # Main JavaScript
│   └── assets/
│       ├── images/            # Product images
│       └── videos/            # Background videos
├── index.html                 # Main HTML file
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind CSS config
├── postcss.config.js          # PostCSS config
├── package.json               # Dependencies
└── README.md                  # Documentation
```

## 🎨 Customization

### Update Warna
Edit `tailwind.config.js`:
```javascript
colors: {
  'corporate': {
    'dark': '#0B1F3A',      // Biru Tua
    'bright': '#1E88E5',    // Biru Terang
    'light': '#f8f9fa',     // Putih Bersih
    'gray': '#e8ecf1',      // Abu-abu Muda
    'gold': '#d4af37',      // Aksen Emas
  },
}
```

### Update Konten
Edit `index.html` untuk mengubah:
- Logo & brand name
- Teks & deskripsi section
- Gambar & video background
- Link & contact info
- Social media links

### Update Animasi
Edit `src/js/main.js` untuk mengatur:
- Delay animasi (AOS)
- Counter animation values
- Slider autoplay duration
- Parallax speed

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## ⚡ Performance

- Lazy loading images
- CSS optimization via Tailwind
- JavaScript minification
- Smooth animations (60fps target)
- Optimized untuk mobile devices
- Small bundle size

## 🔍 SEO

- Meta tags lengkap
- Open Graph tags untuk social sharing
- Semantic HTML structure
- Fast loading time
- Mobile responsive
- Accessible markup

## 🚀 Deployment

### Firebase Hosting (Rekomendasi)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login ke akun Google Anda: `firebase login`
3. Build & Deploy:
```bash
npm run build && firebase deploy
```

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir dist
```

### GitHub Pages
```bash
npm run build
# Push dist folder ke gh-pages branch
```

### Self-Hosted
1. Run `npm run build`
2. Upload folder `dist/` ke server
3. Configure web server untuk serve `index.html`

## 📚 Stack Details

- **HTML5** - Semantic markup, accessibility
- **Tailwind CSS** - Utility-first CSS framework
- **Vanilla JavaScript** - No external JS framework needed
- **AOS** - Animate On Scroll library
- **Swiper.js** - Modern carousel/slider
- **Font Awesome** - Icon library
- **Vite** - Lightning fast build tool

## 🔧 Development

### File Organization
- `src/css/style.css` - Custom styles + Tailwind imports
- `src/js/main.js` - All JavaScript functionality
- `src/assets/` - Images, videos, documents
- `index.html` - Main structure

### Adding New Sections
1. Add HTML in `index.html`
2. Add Tailwind classes for styling
3. Add JS functionality in `src/js/main.js`
4. Add data-aos attributes for animations

## 📄 License

Private Project - MEGATAMA Construction & Engineering

---

**Dibuat dengan ❤️ untuk MEGATAMA**

Untuk informasi lebih lanjut, hubungi: info@megatama.com
