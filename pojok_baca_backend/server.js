const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Konfigurasi Keamanan agar Frontend bisa mengakses server ini
app.use(cors());

// Agar server bisa membaca data berformat JSON yang dikirim dari Frontend
app.use(express.json()); 

// Kunci rahasia untuk membuat token login (JWT). Bebas diganti teks apa saja.
const SECRET_KEY = "KODE_RAHASIA_POJOK_BACA_KAMU";

// 1. KONEKSI KE MYSQL LARAGON (Menargetkan db_pojok_baca secara spesifik)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Default user Laragon
    password: '',      // Default password Laragon (kosong)
    database: 'db_pojok_baca'
});

db.connect((err) => {
    if (err) {
        console.error('Gagal koneksi ke database:', err);
    } else {
        console.log('Berhasil terhubung ke database MySQL Laragon (db_pojok_baca)!');
    }
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

// 4. API UNTUK MENGAMBIL SEMUA BUKU & FILTER BERDASARKAN GENRE
app.get('/api/books', (req, res) => {
    // Mengambil parameter genre dari URL jika ada (misal: /api/books?genre=Novel)
    const { genre } = req.query; 
    
    let query = "SELECT * FROM buku";
    let queryParams = [];

    // Jika user memilih genre tertentu, saring datanya menggunakan WHERE
    if (genre) {
        query += " WHERE genre = ?";
        queryParams.push(genre);
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Mengembalikan daftar buku dalam bentuk JSON ke Frontend
        res.json(results); 
    });
});

// 5. API UNTUK MENGAMBIL DETAIL SATU BUKU BERDASARKAN ID
app.get('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const query = "SELECT * FROM buku WHERE id_buku = ?";
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: "Buku tidak ditemukan" });
        res.json(results[0]);
    });
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
    const query = `
        SELECT buku.* FROM bookmarks 
        JOIN buku ON bookmarks.id_buku = buku.id_buku 
        WHERE bookmarks.id_user = ?
    `;

    db.query(query, [id_user], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results); // Mengembalikan daftar buku favorit dalam bentuk JSON
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
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server Backend Pojok Baca aktif di http://localhost:${PORT}`);
});