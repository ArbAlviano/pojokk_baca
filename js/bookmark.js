const API_URL = window.API_URL || 'http://localhost:5000';

/* js/bookmark.js */

// 1. PROTEKSI HALAMAN: Cek login
const token = localStorage.getItem('token');
const userStorage = localStorage.getItem('user');

if (!token || !userStorage) {
    alert("Akses ditolak! Silakan login terlebih dahulu.");
    window.location.href = 'login.html';
}

const user = JSON.parse(userStorage);

// 2. AMBIL DAFTAR BUKU FAVORIT USER DARI BACKEND
async function loadBookmarkBooks() {
    const bookmarkListContainer = document.getElementById('bookmarkList');
    bookmarkListContainer.innerHTML = "<p>Sedang memuat koleksi Anda...</p>";

    try {
        // Tembak API dengan menyertakan ID User yang sedang login
        const response = await fetch(`${API_URL}/api/bookmarks/${user.id_user}`);
        const books = await response.json();

        bookmarkListContainer.innerHTML = ""; // Bersihkan teks loading

        if (books.length === 0) {
            bookmarkListContainer.innerHTML = "<p style='color: #7f8c8d; font-size: 16px;'>Belum ada buku yang ditambahkan ke bookmark. Cari buku menarik di beranda!</p>";
            return;
        }

        // Looping data JSON dan suntikkan ke dalam HTML katalog
        books.forEach(book => {
            const cardHTML = `
                <div class="book-card">
                    <div>
                        <img src="assets/img/${book.cover_buku}" alt="${book.judul}">
                        <h4>${book.judul}</h4>
                        <p>Penulis: ${book.penulis}</p>
                    </div>
                    <!-- Tombol untuk melihat ulang sinopsis komik/buku -->
                    <a href="detail.html?id=${book.id_buku}" class="btn-read" style="background-color: #3498db;">Lihat Deskripsi</a>
                </div>
            `;
            bookmarkListContainer.innerHTML += cardHTML;
        });

    } catch (error) {
        console.error("Gagal memuat bookmark:", error);
        bookmarkListContainer.innerHTML = "<p>Gagal mengambil data koleksi dari server backend.</p>";
    }
}

// Jalankan fungsi saat halaman dibuka
loadBookmarkBooks();
