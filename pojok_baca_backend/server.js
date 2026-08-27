const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const app = express();

// Konfigurasi Keamanan agar Frontend bisa mengakses server ini
app.use(cors());

// Agar server bisa membaca data berformat JSON yang dikirim dari Frontend
app.use(express.json()); 

// Kunci rahasia untuk membuat token login (JWT). Bebas diganti teks apa saja.
const SECRET_KEY = "KODE_RAHASIA_POJOK_BACA_KAMU";

// Load books from JSON file
const BOOKS_FILE = path.join(__dirname, 'data', 'books.json');
const EBOOK_DIR = path.join(__dirname, '..', '..', 'E-Book');
let booksCache = [];

async function loadBooks() {
    try {
        if (await fs.pathExists(BOOKS_FILE)) {
            booksCache = await fs.readJson(BOOKS_FILE);
            console.log(`Loaded ${booksCache.length} books from JSON`);
        } else {
            console.warn('Books JSON not found. Run "npm run extract" first.');
            booksCache = [];
        }
    } catch (error) {
        console.error('Error loading books:', error);
        booksCache = [];
    }
}

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
const dbConfig = databaseUrl
    ? databaseUrl
    : {
        host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
        port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
        user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
        password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
        database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'db_pojok_baca'
    };
const db = mysql.createConnection(dbConfig);

db.connect((err) => {
    if (err) {
        console.error('Gagal koneksi ke database:', err);
    } else {
        console.log('Berhasil terhubung ke database MySQL Laragon (db_pojok_baca)!');
    }
});

loadBooks();

app.get('/', (req, res) => {
    res.json({ message: 'Pojok Baca API aktif', books: booksCache.length });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// 2. API REGISTER (Pendaftaran Akun Pembaca Baru)
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    // Validasi input kosong
    if (!username || !password) {
        return res.status(400).json({ message: "Username dan password wajib diisi!" });
    }

    try {
        // Enkripsi password agar di database tidak terlihat kata aslinya
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = "INSERT INTO users (username, password) VALUES (?, ?)";
        db.query(query, [username, hashedPassword], (err, result) => {
            if (err) {
                // Mengecek jika username sudah ada di database (karena kolom username di-set UNIQUE)
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: "Username sudah terdaftar!" });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: "Registrasi akun berhasil!" });
        });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan sistem pada server." });
    }
});

// 3. API LOGIN (Masuk & Mendapatkan Token Akses JWT)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const query = "SELECT * FROM users WHERE username = ?";
    db.query(query, [username], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Jika username tidak ditemukan di database
        if (results.length === 0) {
            return res.status(400).json({ message: "Username tidak ditemukan!" });
        }

        const user = results[0];

        // Mencocokkan password yang diketik dengan password terenkripsi di database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Password salah!" });
        }

        // Jika berhasil cocok, buat token digital (JWT) yang berlaku selama 1 hari (24 jam)
        const token = jwt.sign(
            { id_user: user.id_user, username: user.username, role: user.role },
            SECRET_KEY,
            { expiresIn: '1d' }
        );

        // Kirim respon sukses dan token ke Frontend
        res.json({
            message: "Login sukses!",
            token: token,
            user: { id_user: user.id_user, username: user.username, role: user.role }
        });
    });
});

app.get('/api/books', (req, res) => {
    const { genre } = req.query;
    const books = genre
        ? booksCache.filter(book => book.genre.toLowerCase() === String(genre).toLowerCase())
        : booksCache;

    res.json(books.map(({ textContent, ...book }) => book));
});

app.get('/api/books/:id/pdf', (req, res) => {
    const book = booksCache.find(item => item.id_buku === Number(req.params.id));

    if (!book || !book.pdfFile) {
        return res.status(404).json({ message: 'PDF buku tidak ditemukan' });
    }

    if (book.pdfUrl) {
        return res.redirect(book.pdfUrl);
    }

    const pdfPath = path.resolve(EBOOK_DIR, book.pdfFile);
    if (!pdfPath.startsWith(path.resolve(EBOOK_DIR) + path.sep)) {
        return res.status(400).json({ message: 'File PDF tidak valid' });
    }

    res.sendFile(pdfPath, error => {
        if (error && !res.headersSent) {
            res.status(error.statusCode || 500).json({ message: 'Gagal membuka PDF' });
        }
    });
});

app.get('/api/books/:id/text', (req, res) => {
    const book = booksCache.find(item => item.id_buku === Number(req.params.id));

    if (!book) {
        return res.status(404).json({ message: 'Buku tidak ditemukan' });
    }

    res.json({
        id_buku: book.id_buku,
        judul: book.judul,
        pageCount: book.pageCount,
        textContent: book.textContent
    });
});

app.get('/api/books/:id', (req, res) => {
    const book = booksCache.find(item => item.id_buku === Number(req.params.id));

    if (!book) {
        return res.status(404).json({ message: 'Buku tidak ditemukan' });
    }

    const { textContent, ...bookDetail } = book;
    res.json(bookDetail);
});

// 6. API UNTUK MENAMBAH BUKUMARK (Wajib Kirim id_user dan id_buku)
app.post('/api/bookmarks', (req, res) => {
    const { id_user, id_buku } = req.body;

    if (!id_user || !id_buku) {
        return res.status(400).json({ message: "Data tidak lengkap!" });
    }

    // Cek apakah sudah pernah di-bookmark agar tidak duplikat
    const checkQuery = "SELECT * FROM bookmarks WHERE id_user = ? AND id_buku = ?";
    db.query(checkQuery, [id_user, id_buku], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) return res.status(400).json({ message: "Buku sudah ada di bookmark Anda!" });

        // Jika belum ada, masukkan ke tabel bookmarks
        const insertQuery = "INSERT INTO bookmarks (id_user, id_buku) VALUES (?, ?)";
        db.query(insertQuery, [id_user, id_buku], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Buku berhasil ditambahkan ke bookmark!" });
        });
    });
});

// 7. API UNTUK MENGAMBIL DAFTAR BUKU YANG DI-BOOKMARK OLEH USER TERTENTU
app.get('/api/bookmarks/:id_user', (req, res) => {
    const { id_user } = req.params;

    // Menggunakan teknik SQL JOIN untuk mengambil data buku lengkap berdasarkan tabel bookmark
    const query = 'SELECT id_buku FROM bookmarks WHERE id_user = ?';

    db.query(query, [id_user], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const books = results
            .map(({ id_buku }) => booksCache.find(book => book.id_buku === id_buku))
            .filter(Boolean);
        res.json(books.map(({ textContent, ...book }) => book));
    });
});

// 8. API UNTUK MENCATAT RIWAYAT BACA BARU (Dicuat saat tombol baca diklik)
app.post('/api/riwayat', (req, res) => {
    const { id_user, id_buku } = req.body;

    if (!id_user || !id_buku) {
        return res.status(400).json({ message: "Data riwayat tidak lengkap!" });
    }

    // Cek apakah user sudah pernah membaca buku ini sebelumnya
    const checkQuery = "SELECT * FROM riwayat_baca WHERE id_user = ? AND id_buku = ?";
    db.query(checkQuery, [id_user, id_buku], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length > 0) {
            // Jika sudah ada, perbarui saja waktu_baca menjadi jam sekarang
            const updateQuery = "UPDATE riwayat_baca SET waktu_baca = CURRENT_TIMESTAMP WHERE id_user = ? AND id_buku = ?";
            db.query(updateQuery, [id_user, id_buku], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                return res.json({ message: "Waktu riwayat diperbarui!" });
            });
        } else {
            // Jika belum ada, buat baris riwayat baca baru
            const insertQuery = "INSERT INTO riwayat_baca (id_user, id_buku) VALUES (?, ?)";
            db.query(insertQuery, [id_user, id_buku], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                return res.status(201).json({ message: "Riwayat baca baru dicatat!" });
            });
        }
    });
});

// 9. API UNTUK MENGAMBIL 3 RIWAYAT BACA TERAKHIR DARI USER TERTENJU
app.get('/api/riwayat/:id_user', (req, res) => {
    const { id_user } = req.params;

    // Mengambil data buku yang diurutkan berdasarkan waktu baca terbaru (LIMIT 3 saja agar beranda rapi)
    const query = `
        SELECT buku.*, riwayat_baca.waktu_baca FROM riwayat_baca 
        JOIN buku ON riwayat_baca.id_buku = buku.id_buku 
        WHERE riwayat_baca.id_user = ? 
        ORDER BY riwayat_baca.waktu_baca DESC LIMIT 3
    `;

    db.query(query, [id_user], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// MENJALANKAN SERVER BACKEND DI PORT 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Backend Pojok Baca aktif di http://localhost:${PORT}`);
});