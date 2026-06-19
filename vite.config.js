import { defineConfig } from 'vite';
import { resolve } from 'path';
import obfuscator from 'vite-plugin-javascript-obfuscator';

export default defineConfig({
  plugins: [
    obfuscator({
      include: ['**/*.js'],
      exclude: [/node_modules/, /\.html$/],
      apply: 'build', // Hanya berjalan saat proses build production
      options: {
        compact: true,
        controlFlowFlattening: true,
        deadCodeInjection: false,
        debugProtection: true, // Fitur Anti-Inspect: Membuat DevTools hang/freeze
        debugProtectionInterval: 4000,
        disableConsoleOutput: true, // Menghapus semua console.log di production
        identifierNamesGenerator: 'hexadecimal',
        stringArray: true,
        stringArrayEncoding: ['base64'],
      }
    })
  ],
  build: {
    sourcemap: false, // Mencegah browser membangun ulang struktur folder asli (src)
    rollupOptions: {
      output: {
        // Membuat struktur file di Inspect Element menjadi datar (tanpa folder tambahan)
        entryFileNames: `[name]-[hash].js`,
        chunkFileNames: `[name]-[hash].js`,
        assetFileNames: `[name]-[hash].[ext]`
      },
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        detailProyek: resolve(__dirname, 'detail-proyek.html'),
        kontak: resolve(__dirname, 'kontak.html'),
        detailBerita: resolve(__dirname, 'detail-berita.html'),
        monitoringMaterial: resolve(__dirname, 'monitoring-material.html'),
        monitoringKas: resolve(__dirname, 'monitoring-kas.html'),
        monitoringSupplier: resolve(__dirname, 'monitoring-supplier.html'),
        perbandinganHarga: resolve(__dirname, 'perbandingan-harga.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
        siteMap: resolve(__dirname, 'sitemap.html'),
      }
    }
  }
});