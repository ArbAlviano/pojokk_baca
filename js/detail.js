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
            <div class="left-content">
                ${detailCoverImgTag(book)}
                <div class="action-buttons">
                    <a href="reader.html?id=${idBuku}" id="readBtn" class="btn-main-read">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        Mulai Membaca
                    </a>
                    <button id="bookmarkBtn" class="btn-main-bookmark">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        Tambah Bookmark
                    </button>
                </div>
            </div>
            <div class="right-content">
                <span class="tag" style="background: #3498db; color: white;">${book.genre}</span>
                <h1 class="book-title">${book.judul}</h1>
                <h3 class="book-author">Penulis: ${book.penulis}</h3>

                <h4 style="margin: 30px 0 10px; color: var(--text-primary);">Sinopsis / Deskripsi:</h4>
                <div class="summary-box">
                    <p style="margin: 0; line-height: 1.6; color: var(--text-primary); font-size: 16px;">${book.sinopsis}</p>
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
