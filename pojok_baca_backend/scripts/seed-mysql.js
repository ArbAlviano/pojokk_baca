const fs = require('fs-extra');
const path = require('path');
const mysql = require('mysql2/promise');

const booksFile = path.join(__dirname, '..', 'data', 'books.json');

async function main() {
  const books = await fs.readJson(booksFile);
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_pojok_baca'
  });

  for (const book of books) {
    await db.execute(
      `INSERT INTO buku
        (id_buku, judul, penulis, genre, cover_buku, sinopsis, textContent, pageCount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        judul = VALUES(judul), penulis = VALUES(penulis), genre = VALUES(genre),
        cover_buku = VALUES(cover_buku), sinopsis = VALUES(sinopsis),
        textContent = VALUES(textContent), pageCount = VALUES(pageCount)`,
      [book.id_buku, book.judul, book.penulis, book.genre, book.cover_buku,
        book.sinopsis || null, book.textContent || '', book.pageCount || 0]
    );
  }

  await db.end();
  console.log(`Seeded ${books.length} books into buku table`);
}

main().catch(error => {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
});
