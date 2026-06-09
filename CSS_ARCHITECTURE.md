/* 
MEGATAMA Website - CSS Architecture
====================================

ORGANIZATION:
1. Base & Reset
2. Variables & Theme
3. Components
4. Utilities
5. Animations
6. Media Queries

COLOR SCHEME:
- Corporate Dark: #0B1F3A
- Corporate Bright: #1E88E5
- Light: #f8f9fa
- Gray: #e8ecf1
- Gold: #d4af37

TYPOGRAPHY:
- Font Family: Inter, Segoe UI
- Weights: 300, 400, 500, 600, 700, 800
- Scale: 1rem base

SPACING:
- Base unit: 0.25rem (4px)
- Scale: 1x, 2x, 3x, 4x, 6x, 8x, 12x...

ANIMATIONS:
- Duration: 300-800ms
- Easing: ease-in-out, cubic-bezier
- Performance: GPU-accelerated (transform, opacity)

RESPONSIVE:
- Mobile First approach
- Breakpoints: 640px, 768px, 1024px, 1280px
*/

/* Import Statements */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* Custom Components */
.navbar { /* See style.css */ }
.hero { /* See style.css */ }
.section { /* See style.css */ }
.card-hover { /* See style.css */ }
.btn-primary { /* See style.css */ }
.btn-secondary { /* See style.css */ }

/* Modifier Classes */
.scrolled { /* Applied via JS */ }
.active { /* Applied via JS */ }
.loaded { /* Applied via JS */ }

/* CSS Custom Properties (if using CSS-in-JS) */
:root {
  --color-dark: #0B1F3A;
  --color-bright: #1E88E5;
  --color-light: #f8f9fa;
  --color-gray: #e8ecf1;
  --color-gold: #d4af37;
  
  --duration-fast: 300ms;
  --duration-normal: 500ms;
  --duration-slow: 800ms;
  
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Responsive Typography Scale */
html {
  font-size: 16px;
}

@media (min-width: 768px) {
  html {
    font-size: 18px;
  }
}

@media (min-width: 1280px) {
  html {
    font-size: 20px;
  }
}
