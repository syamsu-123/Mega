import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        detailProyek: resolve(__dirname, 'detail-proyek.html'),
        kontak: resolve(__dirname, 'kontak.html'),
        detailBerita: resolve(__dirname, 'detail-berita.html'),
        monitoringMaterial: resolve(__dirname, 'monitoring-material.html'),
        monitoringSupplier: resolve(__dirname, 'monitoring-supplier.html'),
        perbandinganHarga: resolve(__dirname, 'perbandingan-harga.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
        siteMap: resolve(__dirname, 'sitemap.html'),
      }
    }
  }
});