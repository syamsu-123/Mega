import { getNewsById } from './firebase-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Mengambil Parameter ID dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');

    if (!newsId) {
        window.location.href = 'index.html'; // Kembalikan ke beranda jika tidak ada ID
        return;
    }

    const article = await getNewsById(newsId);
    
    const loadingIndicator = document.getElementById('loading-indicator');
    const articleContainer = document.getElementById('article-container');

    if (!article) {
        if (loadingIndicator) {
            loadingIndicator.innerHTML = `
                <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <h2 class="text-2xl font-bold text-gray-800">Berita Tidak Ditemukan</h2>
                <p class="text-gray-500 mt-2 mb-6">Artikel yang Anda cari mungkin telah dihapus atau URL tidak valid.</p>
                <a href="index.html#news" class="bg-corporate-bright text-white px-6 py-2.5 rounded-lg hover:bg-orange-700 transition-colors">Kembali ke Beranda</a>
            `;
        }
        return;
    }

    // Menyembunyikan loading dan menampilkan form
    if (loadingIndicator) loadingIndicator.classList.add('hidden');
    if (articleContainer) articleContainer.classList.remove('hidden');

    document.title = article.title + ' - MEGATAMA';
    document.getElementById('news-title').textContent = article.title;
    document.getElementById('news-category').textContent = article.category || 'Berita';
    document.getElementById('news-date').innerHTML = `<i class="fas fa-calendar mr-2"></i>${article.date || '-'}`;
    
    if (article.imageUrl) {
        const imgEl = document.getElementById('news-image');
        imgEl.src = article.imageUrl;
        imgEl.classList.remove('hidden');
    }
    
    // Mengubah NewLine (\n) menjadi <br> agar paragraf rapi
    const formattedContent = (article.content || '').replace(/\n/g, '<br><br>');
    document.getElementById('news-body').innerHTML = formattedContent;
});