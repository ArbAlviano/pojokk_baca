// Resolusi buku dari daftar buku dengan membuang textContent (payload besar)
// supaya konsisten antara endpoint bookmark dan riwayat. Mengembalikan null
// bila id_buku tidak ditemukan di daftar buku.
function resolveBookFromCache(books, idBuku, extra = {}) {
    const book = books.find(b => b.id_buku === idBuku);
    if (!book) return null;
    const { textContent, ...meta } = book;
    return { ...meta, ...extra };
}

module.exports = { resolveBookFromCache };
