/* js/home.js */

// 1. PROTEKSI HALAMAN: Cek apakah user sudah login
const token = localStorage.getItem('token');
const userStorage = localStorage.getItem('user');

if (!token || !userStorage) {
    alert("Akses ditolak! Silakan login terlebih dahulu.");
    window.location.href = 'login.html';
} else {
    // Tampilkan nama user di navbar jika berhasil login
    const user = JSON.parse(userStorage);
    document.getElementById('welcomeText').innerText = `Halo, ${user.username}!`;
}

// 2. FUNGSI AMBIL DATA BUKU DARI BACKEND
async function loadBooks(genre = '') {
    const bookListContainer = document.getElementById('bookList');
    bookListContainer.innerHTML = "<p>Sedang memuat buku...</p>";

    // Atur status aktif pada tombol filter yang sedang diklik
    const buttons = document.querySelectorAll('.btn-filter');
    buttons.forEach(btn => {
        if(btn.textContent === (genre || 'Semua')) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    try {
        // Tembak API backend (menggunakan parameter filter jika genre diisi)
        const response = await fetch(`https://3h11btfg-5000.asse.devtunnels.ms//api/books?genre=${genre}`);
        const books = await response.json();

        bookListContainer.innerHTML = ""; // Bersihkan teks loading

        if (books.length === 0) {
            bookListContainer.innerHTML = "<p>Tidak ada buku dalam genre ini.</p>";
            return;
        }

        // Looping data JSON dan suntikkan ke dalam HTML
        books.forEach(book => {
            // Menggunakan layanan placeholder otomatis karena file cover fisik belum diunggah asli
            // KODE BARU (Mengambil foto asli dari folder assets/img):
            const coverUrl = `assets/img/${book.cover_buku}`;

            
            const cardHTML = `
                <div class="book-card">
                    <div>
                        <img src="${coverUrl}" alt="${book.judul}">
                        <h4>${book.judul}</h4>
                        <p>Penulis: ${book.penulis}</p>
                    </div>
                    <!-- MENGARAHKAN KE HALAMAN DETAIL BUKU SEPERTI YANG KAMU MAU -->
                    <a href="detail.html?id=${book.id_buku}" class="btn-read" style="background-color: #3498db;">Lihat Deskripsi</a>
                    </div>
                `;
            ;
            bookListContainer.innerHTML += cardHTML;
        });

    } catch (error) {
        console.error("Gagal memuat buku:", error);
        bookListContainer.innerHTML = "<p>Gagal mengambil data dari server backend.</p>";
    }
}

// Jalankan fungsi memuat semua buku pertama kali saat halaman dibuka
loadBooks();

// 3. LOGIKA LOGOUT
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear(); // Hapus token dari browser
    alert("Berhasil logout!");
    window.location.href = 'login.html';
});

/* Tambahkan ini di bagian paling bawah file js/home.js */

async function loadReadingHistory() {
    const user = JSON.parse(userStorage);
    const historySection = document.getElementById('historySection');
    const historyListContainer = document.getElementById('historyList');

    try {
        const response = await fetch(`https://3h11btfg-5000.asse.devtunnels.ms/api/riwayat/${user.id_user}`);
        const historyBooks = await response.json();

        if (historyBooks.length === 0) {
            historySection.style.display = "none"; // Sembunyikan section jika riwayat masih kosong
            return;
        }

        historySection.style.display = "block"; // Munculkan jika ada riwayat
        historyListContainer.innerHTML = "";

        historyBooks.forEach(book => {
            const cardHTML = `
                <div class="book-card">
                    <div>
                        <img src="assets/img/${book.cover_buku}" alt="${book.judul}">
                        <h4>${book.judul}</h4>
                        <p style="color: #e74c3c; font-weight: bold; font-size: 11px;">Dibaca baru-baru ini</p>
                    </div>
                    <a href="detail.html?id=${book.id_buku}" class="btn-read" style="background-color: #e74c3c;">Lanjut Baca</a>
                </div>
            `;
            historyListContainer.innerHTML += cardHTML;
        });
    } catch (error) {
        console.error("Gagal memuat riwayat baca:", error);
    }
}

// Jalankan fungsi riwayat baca ini tepat di bawah pemanggilan loadBooks()
loadReadingHistory();
