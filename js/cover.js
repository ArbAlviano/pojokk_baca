function coverImgTag(book, colorHex) {
    const fallbackCover = `https://placehold.co/200x300/${colorHex}/ffffff?text=${encodeURIComponent(book.judul)}`;
    return `<img src="assets/img/${book.cover_buku}" alt="${book.judul}" onerror="this.onerror=null;this.src='${fallbackCover}';">`;
}

function detailCoverImgTag(book) {
    const fallbackCover = `https://placehold.co/250x360/6c5ce7/ffffff?text=${encodeURIComponent(book.judul)}`;
    return `<img src="assets/img/${book.cover_buku}" alt="${book.judul}" onerror="this.onerror=null;this.src='${fallbackCover}';" style="width: 250px; height: 360px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">`;
}