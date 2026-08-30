const API_URL = window.API_URL || 'http://localhost:5000';

/* js/home.js */

// 1. PROTEKSI HALAMAN: Cek apakah user sudah login
const token = localStorage.getItem('token');
const userStorage = localStorage.getItem('user');

if (!token || !userStorage) {
    alert("Akses ditolak! Silakan login terlebih dahulu.");
    window.location.href = 'login.html';
}

// 2. STATE: daftar buku, filter, pencarian, dan paginasi
let allBooks = [];
let currentGenre = '';
let searchQuery = '';
let currentPage = 1;
const PER_PAGE = 20;

// 3. FUNGSI RENDER KATALOG (filter genre + pencarian + paginasi)
async function loadBooks(genre = '') {
    currentGenre = genre;
    currentPage = 1;

    // Atur status aktif pada tombol filter yang sedang diklik
    const buttons = document.querySelectorAll('.btn-filter');
    buttons.forEach(btn => {
        if (btn.textContent === (genre || 'Semua')) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    const bookListContainer = document.getElementById('bookList');
    bookListContainer.innerHTML = "<p>Sedang memuat buku...</p>";

    // Ambil semua buku dari backend (hanya sekali), lalu filter di sisi klien
    if (allBooks.length === 0) {
        try {
            const response = await fetch(`${API_URL}/api/books?genre=`);
            allBooks = await response.json();
        } catch (error) {
            console.error("Gagal mengambil data buku:", error);
            bookListContainer.innerHTML = "<p>Gagal mengambil data dari server backend.</p>";
            return;
        }
    }

    buildGenreFilters();
    applyFilters();
}

function applyFilters() {
    const bookListContainer = document.getElementById('bookList');

    // Filter: genre
    let list = currentGenre
        ? allBooks.filter(book => book.genre && book.genre.toLowerCase() === String(currentGenre).toLowerCase())
        : allBooks.slice();

    // Filter: pencarian (judul atau penulis)
    const q = searchQuery.trim().toLowerCase();
    if (q) {
        list = list.filter(book => {
            const judul = (book.judul || '').toLowerCase();
            const penulis = (book.penulis || '').toLowerCase();
            return judul.includes(q) || penulis.includes(q);
        });
    }

    // Paginasi
    const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * PER_PAGE;
    const pageBooks = list.slice(start, start + PER_PAGE);

    if (list.length === 0) {
        bookListContainer.innerHTML = "<p>Tidak ada buku yang cocok.</p>";
        renderPagination(0);
        return;
    }

    bookListContainer.innerHTML = "";
    pageBooks.forEach(book => {
        const cardHTML = `
            <div class="book-card">
                <div>
                    ${coverImgTag(book, '3b82f6')}
                    <h4>${book.judul}</h4>
                    <p>Penulis: ${book.penulis}</p>
                </div>
                <a href="detail.html?id=${book.id_buku}" class="btn-read" style="background-color: #3498db;">Lihat Deskripsi</a>
            </div>
        `;
        bookListContainer.innerHTML += cardHTML;
    });

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    if (totalPages <= 1) {
        pagination.innerHTML = "";
        return;
    }

    const btn = (label, onClick, isActive, disabled) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'page-btn' + (isActive ? ' active' : '');
        b.textContent = label;
        b.disabled = !!disabled;
        b.addEventListener('click', onClick);
        return b;
    };

    pagination.innerHTML = "";

    // Tombol Sebelumnya
    pagination.appendChild(btn('‹', () => { currentPage--; applyFilters(); window.scrollTo({ top: 0, behavior: 'smooth' }); }, false, currentPage === 1));

    // Nomor halaman (semua)
    for (let i = 1; i <= totalPages; i++) {
        let page = i;
        pagination.appendChild(btn(String(i), () => { currentPage = page; applyFilters(); window.scrollTo({ top: 0, behavior: 'smooth' }); }, i === currentPage, false));
    }

    // Tombol Berikutnya
    pagination.appendChild(btn('›', () => { currentPage++; applyFilters(); window.scrollTo({ top: 0, behavior: 'smooth' }); }, false, currentPage === totalPages));
}

// 3b. BANGUN TOMBOL FILTER GENRE DINAMIS BERDASARKAN DATA
function buildGenreFilters() {
    const container = document.getElementById('genreFilter');
    if (!container) return;
    if (container.children.length > 1) return;

    const preferredOrder = ['Novel', 'Edukasi', 'Religi', 'Kumpulan Cerita', 'Puisi'];
    const genres = [];
    const seen = new Set();

    allBooks.forEach(book => {
        const g = book.genre;
        if (!g) return;
        const key = String(g);
        if (seen.has(key.toLowerCase())) return;
        seen.add(key.toLowerCase());
        genres.push(key);
    });

    genres.sort((a, b) => {
        const ia = preferredOrder.indexOf(a);
        const ib = preferredOrder.indexOf(b);
        return (ia === -1 ? preferredOrder.length : ia) - (ib === -1 ? preferredOrder.length : ib);
    });

    genres.forEach(genre => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-filter';
        btn.textContent = genre;
        btn.addEventListener('click', () => loadBooks(genre));
        container.appendChild(btn);
    });
}

// 4. LOGIKA PENCARIAN (ikon di header membuka bar pencarian)
function toggleSearchBar() {
    const bar = document.getElementById('searchBar');
    const input = document.getElementById('searchInput');
    if (bar.hidden) {
        bar.hidden = false;
        input.focus();
    } else {
        bar.hidden = true;
        input.value = '';
        searchQuery = '';
        currentPage = 1;
        applyFilters();
    }
}

// Jalankan fungsi memuat semua buku pertama kali saat halaman dibuka
loadBooks();

// Pasang event pencarian setelah elemen ada
document.getElementById('searchInput').addEventListener('input', function () {
    searchQuery = this.value;
    currentPage = 1;
    applyFilters();
});

/* Tambahkan ini di bagian paling bawah file js/home.js */

async function loadReadingHistory() {
    const user = JSON.parse(userStorage);
    const historySection = document.getElementById('historySection');
    const historyListContainer = document.getElementById('historyList');

    try {
        const response = await fetch(`${API_URL}/api/riwayat/${user.id_user}`);
        const historyBooks = await response.json();

        if (historyBooks.length === 0) {
            historySection.style.display = "none"; // Sembunyikan section jika riwayat masih kosong
            return;
        }

        historySection.style.display = "block"; // Munculkan jika ada riwayat
        historyListContainer.innerHTML = "";

        if (new URLSearchParams(window.location.search).get('riwayat') === '1') {
            setTimeout(() => historySection.scrollIntoView({ behavior: 'smooth' }), 100);
        }

        historyBooks.forEach(book => {
            const cardHTML = `
                <div class="book-card">
                    <div>
                        ${coverImgTag(book, 'e74c3c')}
                        <h4>${book.judul}</h4>
                        <p style="color: #e74c3c; font-weight: bold; font-size: 11px;">Dibaca baru-baru ini</p>
                    </div>
                    <a href="reader.html?id=${book.id_buku}" class="btn-read" style="background-color: #e74c3c;">Lanjut Baca</a>
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
