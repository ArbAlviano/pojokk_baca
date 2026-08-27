const API_URL = window.API_URL || 'http://localhost:5000';

/* js/detail.js */

// 1. Ambil ID Buku dari URL (misal: detail.html?id=1)
const urlParams = new URLSearchParams(window.location.search);
const idBuku = urlParams.get('id');

const userStorage = localStorage.getItem('user');
const user = JSON.parse(userStorage);

async function loadBookDetail() {
    if (!idBuku) {
        document.getElementById('bookDetail').innerHTML = "<p>Buku tidak ditemukan.</p>";
        return;
    }

    try {
        // Ambil data detail buku dari backend
        const response = await fetch(`${API_URL}/api/books/${idBuku}`);
        const book = await response.json();

        if (!response.ok) {
            document.getElementById('bookDetail').innerHTML = `<p>${book.message}</p>`;
            return;
        }

        // Tampilkan foto cover asli, judul, penulis, dan SINOPSIS/DESKRIPSI lengkap
        document.getElementById('bookDetail').innerHTML = `
            <div style="flex: 1; text-align: center;">
                <img src="assets/img/${book.cover_buku}" alt="${book.judul}" style="width: 250px; height: 360px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
            </div>
            <div style="flex: 2;">
                <span style="background: #3498db; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">${book.genre}</span>
                <h1 style="margin: 15px 0 5px; color: var(--text-primary);">${book.judul}</h1>
                <h3 style="margin: 0 0 20px; color: var(--text-secondary); font-weight: normal;">Penulis: ${book.penulis}</h3>
                
                <h4 style="margin: 30px 0 10px; color: var(--text-primary);">Sinopsis / Deskripsi:</h4>
                <p style="line-height: 1.6; color: var(--text-primary); font-size: 16px; margin-bottom: 4px;">${book.sinopsis}</p>
                
                <div style="margin-top: 40px; display: flex; gap: 15px;">
                    <!-- PERBAIKAN DI SINI: Sudah ditambah id="readBtn" -->
                    <a href="reader.html?id=${idBuku}" id="readBtn" target="_blank" class="btn-read" style="padding: 12px 30px; font-size: 16px; background-color: #6c5ce7; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">📖 Mulai Membaca</a>
                    <button id="bookmarkBtn" style="background-color: #f1c40f; color: #2c3e50; border: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; font-size: 16px; cursor: pointer;">⭐ Tambah Bookmark</button>
                </div>
            </div>
        `;

        // Pasang fungsi klik untuk tombol bookmark setelah elemennya dibuat
        document.getElementById('bookmarkBtn').addEventListener('click', addToBookmark);
        
        // Pasang fungsi klik untuk tombol membaca (sekarang sudah aman karena id="readBtn" sudah ada di atas)
        document.getElementById('readBtn').addEventListener('click', async () => {
            try {
                // Kirim data ke API riwayat tanpa mengganggu pembukaan file PDF
                await fetch(`${API_URL}/api/riwayat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_user: user.id_user,
                        id_buku: idBuku
                    })
                });
            } catch (error) {
                console.error("Gagal mencatat riwayat:", error);
            }
        });

    } catch (error) {
        console.error("Error:", error);
        document.getElementById('bookDetail').innerHTML = "<p>Gagal memuat detail server.</p>";
    }
}

// 3. FUNGSI KIRIM DATA BOOKMARK KE BACKEND
async function addToBookmark() {
    try {
        const response = await fetch(`${API_URL}/api/bookmarks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_user: user.id_user,
                id_buku: idBuku
            })
        });

        const data = await response.json();
        alert(data.message);

    } catch (error) {
        console.error("Gagal menambahkan bookmark:", error);
        alert("Terjadi kesalahan sistem.");
    }
}

// Jalankan saat halaman dibuka
loadBookDetail();
