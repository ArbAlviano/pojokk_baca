const API_URL = window.API_URL || 'http://localhost:5000';
const params = new URLSearchParams(window.location.search);
const bookId = params.get('id');
const titleElement = document.getElementById('bookTitle');
const statusElement = document.getElementById('readerStatus');
const pdfViewer = document.getElementById('pdfViewer');

document.getElementById('backBtn').addEventListener('click', () => history.back());

async function loadBook() {
    if (!bookId) {
        statusElement.textContent = 'ID buku tidak ditemukan.';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/books/${bookId}`);
        const book = await response.json();

        if (!response.ok) {
            throw new Error(book.message || 'Buku tidak ditemukan.');
        }

        titleElement.textContent = book.judul;
        statusElement.textContent = `${book.pageCount} halaman`;
        pdfViewer.src = `${API_URL}/api/books/${bookId}/pdf`;
    } catch (error) {
        titleElement.textContent = 'Gagal memuat buku';
        statusElement.textContent = error.message;
        pdfViewer.remove();
    }
}

loadBook();
