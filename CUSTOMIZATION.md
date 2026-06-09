# MEGATAMA Website - Customization Guide

## 🎨 Visual Customization

### Brand Colors

Edit `tailwind.config.js`:

```javascript
colors: {
  'corporate': {
    'dark': '#0B1F3A',      // Change to your dark color
    'bright': '#1E88E5',    // Change to your bright color
    'light': '#f8f9fa',     // Light background
    'gray': '#e8ecf1',      // Gray background
    'gold': '#d4af37',      // Accent color
  },
}
```

**Where colors are used:**
- Dark: Navbar, footer, headings
- Bright: Buttons, accents, icons
- Light: Backgrounds
- Gray: Section backgrounds
- Gold: Subtle accents

### Fonts

Edit in `index.html` or `src/css/style.css`:

```html
<!-- Change Google Font -->
<link href="https://fonts.googleapis.com/css2?family=YOUR_FONT:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

Update font family in `style.css`:
```css
body {
    font-family: 'Your Font', 'Segoe UI', sans-serif;
}
```

### Logo

Replace in `index.html`:
```html
<!-- Replace this -->
<div class="navbar-logo">
    <i class="fas fa-building text-2xl"></i>
    <span>MEGATAMA</span>
</div>

<!-- With your logo -->
<div class="navbar-logo">
    <img src="src/assets/images/logo.png" alt="Logo" class="h-8">
</div>
```

## 📝 Content Customization

### Company Information

#### Hero Section
Edit in `index.html` `#hero` section:
```html
<h1 class="hero-title">
    YOUR COMPANY MISSION TEXT
</h1>
<p class="hero-subtitle">
    YOUR COMPANY DESCRIPTION
</p>
```

#### About Section
Edit `#about` section:
- Company description
- Vision statement
- Mission statement
- Core values (integritas, profesionalisme, inovasi, kualitas)

#### Business Divisions
Edit `#divisions` cards (6 items):
- Title
- Description
- Icon (Font Awesome)

#### Services
Edit `#services` cards (6 services):
- Title
- Description
- Icon

### Navigation Menu

Edit navbar menu items:
```html
<div class="navbar-menu">
    <a href="#hero">Your Link 1</a>
    <a href="#section">Your Link 2</a>
    <!-- Add more links -->
</div>
```

### Portfolio

Replace portfolio items in `#portfolio`:
```html
<div class="portfolio-item" data-category="gedung">
    <img src="YOUR_IMAGE" alt="Project Name">
    <div>
        <h3>Project Name</h3>
        <p>Project Location | Year</p>
    </div>
</div>
```

**Categories available:**
- gedung (Buildings)
- infrastruktur (Infrastructure)
- industri (Industrial)
- properti (Property)
- all (Show all)

### Projects Showcase

Update featured projects in `#projects`:
- Project images
- Project names
- Locations & years
- Progress percentages
- Project values

### Testimonials

Update testimonials in `#testimonials`:
```html
<div class="swiper-slide">
    <img src="client-photo" alt="Name">
    <h4>Client Name</h4>
    <p>Job Title / Company</p>
    <p>Testimonial text...</p>
    <div class="stars">
        <!-- Star rating -->
    </div>
</div>
```

### News / Blog

Update news items in `#news`:
- Article image
- Title
- Summary
- Date
- "Read more" link

### Contact Information

Edit `#contact` section:
- Address
- Email
- Phone
- Operating hours
- Google Maps embed code

#### Update Google Maps
```html
<iframe src="https://www.google.com/maps/embed?pb=YOUR_EMBED_CODE">
</iframe>
```

To get embed code:
1. Go to Google Maps
2. Search for your address
3. Click "Share"
4. Click "Embed a map"
5. Copy the embed code

### Social Media Links

Update in footer and contact section:
```html
<a href="https://facebook.com/yourpage">
    <i class="fab fa-facebook-f"></i>
</a>
<!-- LinkedIn, Instagram, YouTube, etc -->
```

## ⚙️ Functionality Customization

### Counter Animation Speed

Edit `src/js/main.js`:
```javascript
function animateCounters() {
    // ...
    const duration = 2000; // Change this value (milliseconds)
    // ...
}
```

### Slider Settings

Edit `src/js/main.js`:

**Clients Slider:**
```javascript
const clientsSwiper = new Swiper('.clientsSwiper', {
    autoplay: {
        delay: 3000,  // Change delay
    },
    slidesPerView: 4,  // Change number of visible slides
});
```

**Testimonials Slider:**
```javascript
const testimonialSwiper = new Swiper('.testimonialSwiper', {
    autoplay: {
        delay: 5000,  // Change delay
    },
    slidesPerView: 3,  // Change number of visible slides
});
```

### Animation Settings

Edit `tailwind.config.js`:
```javascript
animation: {
    'float': 'float 3s ease-in-out infinite',  // Change speed
    'pulse-slow': 'pulse 2s cubic-bezier(...)',
    'slide-in': 'slideIn 0.6s ease-out',       // Change timing
}
```

### AOS Animation Settings

Edit `src/js/main.js`:
```javascript
AOS.init({
    duration: 800,      // Animation duration
    offset: 100,        // Trigger offset
    once: true,         // Animate only once
    easing: 'ease-in-out-cubic'
});
```

### Scroll Progress Bar

The scroll progress bar is automatic. To disable:
```javascript
// In main.js, comment out or remove:
scrollProgressBar.style.width = scrollPercent + '%';
```

## 📊 SEO Customization

### Meta Tags

Edit `index.html` `<head>`:
```html
<meta name="description" content="YOUR DESCRIPTION">
<meta name="keywords" content="keyword1, keyword2, keyword3">
<meta name="author" content="YOUR COMPANY">
<meta property="og:title" content="YOUR TITLE">
<meta property="og:description" content="YOUR DESCRIPTION">
<meta property="og:image" content="your-image-url">
```

### Structured Data

Add to `index.html` before `</head>`:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "MEGATAMA",
  "url": "https://megatama.com",
  "logo": "https://megatama.com/logo.png",
  "description": "Your company description"
}
</script>
```

## 🛠️ Advanced Customization

### Adding New Sections

1. Add HTML in `index.html`
2. Add ID for navigation: `<section id="newsection">`
3. Add navbar link: `<a href="#newsection">New Section</a>`
4. Add Tailwind classes for styling
5. Add `data-aos` for animations
6. Add CSS in `src/css/style.css` if needed
7. Add JS functionality in `src/js/main.js`

### Adding Forms

Use the contact form as template:
```html
<form id="my-form">
    <input type="text" class="form-input" placeholder="Name">
    <textarea class="form-textarea"></textarea>
    <button type="submit" class="btn-primary">Submit</button>
</form>
```

Handle submission in `src/js/main.js`:
```javascript
document.getElementById('my-form').addEventListener('submit', (e) => {
    e.preventDefault();
    // Handle form data
});
```

### Custom Animations

Add to `src/css/style.css`:
```css
@keyframes myAnimation {
    0% { transform: translateY(0); }
    100% { transform: translateY(-20px); }
}

.my-element {
    animation: myAnimation 1s ease-in-out infinite;
}
```

## 🔗 External Integrations

### Contact Form Integration

**Option 1: Formspree**
```html
<form action="https://formspree.io/f/YOUR_ID" method="POST">
    <!-- form fields -->
</form>
```

**Option 2: Netlify Forms**
```html
<form name="contact" method="POST" netlify>
    <!-- form fields -->
</form>
```

### Newsletter Signup

```html
<form action="https://YOUR_EMAIL_SERVICE" method="POST">
    <input type="email" name="email" required>
    <button type="submit">Subscribe</button>
</form>
```

### Live Chat

Add to before `</body>`:
```html
<script src="https://your-chat-service.com/chat.js"></script>
```

## 📱 Responsive Customization

### Breakpoint Tailoring

Edit breakpoints in `tailwind.config.js`:
```javascript
screens: {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
}
```

### Mobile-First Design

All CSS should start with mobile, then add complexity:
```css
/* Mobile first */
.element { /* mobile styles */ }

/* Then add tablet/desktop */
@media (min-width: 768px) {
    .element { /* tablet styles */ }
}
```

## 🚀 Performance Customization

### Image Optimization

Install sharp for batch image optimization:
```bash
npm install sharp-cli --save-dev
```

### Lazy Loading

Already implemented for portfolio items. To add more:
```html
<img src="placeholder.jpg" data-src="real-image.jpg" alt="">
```

### Bundle Size

Check bundle size:
```bash
npm run build -- --analyze
```

## 📚 Useful Resources

- **Tailwind**: https://tailwindcss.com/docs
- **Font Awesome**: https://fontawesome.com/docs
- **Swiper**: https://swiperjs.com/swiper-api
- **AOS**: https://michalsnik.github.io/aos/

---

**Need help?** Contact: support@megatama.com
