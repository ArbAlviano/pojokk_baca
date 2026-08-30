const fs = require('fs');
const path = require('path');

const BOOKS_FILE = path.join(__dirname, '..', 'data', 'books.json');

// Map id_buku -> genre berdasarkan judul dan sinopsis.
const GENRES = {
  1: 'Novel', 2: 'Novel', 3: 'Novel', 4: 'Novel', 5: 'Novel',
  6: 'Novel', 7: 'Novel', 8: 'Novel', 9: 'Novel', 10: 'Novel',
  11: 'Novel', 12: 'Novel', 13: 'Kumpulan Cerita', 14: 'Novel',
  15: 'Edukasi', 16: 'Novel', 17: 'Novel', 18: 'Novel',
  19: 'Edukasi', 20: 'Edukasi', 21: 'Novel', 22: 'Novel',
  23: 'Novel', 24: 'Novel', 25: 'Puisi', 26: 'Novel', 27: 'Novel',
  28: 'Religi', 29: 'Novel', 30: 'Novel', 31: 'Kumpulan Cerita',
  32: 'Novel', 33: 'Novel', 34: 'Kumpulan Cerita',
  35: 'Kumpulan Cerita', 36: 'Novel', 37: 'Novel', 38: 'Religi',
  39: 'Novel', 40: 'Novel', 41: 'Kumpulan Cerita',
  42: 'Kumpulan Cerita', 43: 'Kumpulan Cerita', 44: 'Novel',
  45: 'Puisi', 46: 'Novel', 47: 'Novel', 48: 'Novel', 49: 'Novel',
  50: 'Novel', 51: 'Novel', 52: 'Novel', 53: 'Novel', 54: 'Novel',
  55: 'Edukasi', 56: 'Puisi', 57: 'Edukasi', 58: 'Novel',
  59: 'Novel', 60: 'Novel', 61: 'Novel', 62: 'Novel', 63: 'Religi',
  64: 'Novel', 65: 'Novel', 66: 'Novel', 67: 'Religi',
  68: 'Religi', 69: 'Novel', 70: 'Religi', 71: 'Religi',
  72: 'Religi', 73: 'Religi', 74: 'Religi', 75: 'Novel',
  76: 'Novel', 77: 'Kumpulan Cerita', 78: 'Novel', 79: 'Novel',
  80: 'Novel', 81: 'Novel', 82: 'Novel', 83: 'Novel', 84: 'Novel',
  85: 'Edukasi', 86: 'Kumpulan Cerita', 87: 'Novel', 88: 'Novel',
  89: 'Religi', 90: 'Novel', 91: 'Novel', 92: 'Religi',
  93: 'Religi', 94: 'Edukasi', 95: 'Edukasi', 96: 'Edukasi',
  97: 'Edukasi', 98: 'Edukasi', 99: 'Edukasi',
  100: 'Kumpulan Cerita', 101: 'Edukasi', 102: 'Novel',
  103: 'Religi', 104: 'Novel', 105: 'Novel',
  106: 'Kumpulan Cerita', 107: 'Novel', 108: 'Novel', 109: 'Novel',
  110: 'Novel', 111: 'Novel', 112: 'Kumpulan Cerita',
  113: 'Novel', 114: 'Novel', 115: 'Novel', 116: 'Novel',
  117: 'Novel', 118: 'Novel', 119: 'Novel', 120: 'Novel',
  121: 'Novel', 122: 'Novel', 123: 'Edukasi', 124: 'Novel',
  125: 'Novel'
};

// Entri judul duplikat yang dihapus (tetap mempertahankan id yang lebih kecil).
const REMOVE_IDS = [8, 10, 24, 71, 88, 94, 95, 96, 109];

const books = JSON.parse(fs.readFileSync(BOOKS_FILE, 'utf8'));

const before = books.length;
const removed = books
  .filter(book => REMOVE_IDS.includes(Number(book.id_buku)))
  .map(book => `${book.id_buku} (${book.judul})`);
const remaining = books.filter(book => !REMOVE_IDS.includes(Number(book.id_buku)));

let updatedGenre = 0;
for (const book of remaining) {
  const genre = GENRES[Number(book.id_buku)];
  if (genre && book.genre !== genre) {
    book.genre = genre;
    updatedGenre++;
  }
}

fs.writeFileSync(BOOKS_FILE, JSON.stringify(remaining, null, 2), 'utf8');

console.log(`Total sebelum: ${before}`);
console.log(`Dihapus (${removed.length}):`);
removed.forEach(item => console.log(`  - ${item}`));
console.log(`Total sesudah: ${remaining.length}`);
console.log(`Genre diperbarui: ${updatedGenre}`);