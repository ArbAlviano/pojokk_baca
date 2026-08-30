import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

const API_URL = window.API_URL || 'https://pojokkbaca-production.up.railway.app';
const params = new URLSearchParams(window.location.search);
const bookId = params.get('id');

const titleElement = document.getElementById('bookTitle');
const pageInfo = document.getElementById('pageInfo');
const progressFill = document.getElementById('progressFill');
const pdfContainer = document.getElementById('pdfContainer');
const loadingOverlay = document.getElementById('loadingOverlay');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const pageInput = document.getElementById('pageInput');
const totalPagesEl = document.getElementById('totalPages');
const backBtn = document.getElementById('backBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const readerContainer = document.getElementById('readerContainer');

let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let saveProgressTimer = null;
let pageRenderQueue = new Map();
let maxParallel = 3;
let activeRenders = 0;
const renderedPages = new Set();

function getAuth() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return { token, id_user: user.id_user };
    } catch {
        return { token: null, id_user: null };
    }
}

function updateProgress(page) {
    if (!totalPages) return;
    const percent = Math.min(100, Math.round((page / totalPages) * 100));
    progressFill.style.width = `${percent}%`;
    progressFill.parentElement.setAttribute('aria-valuenow', percent);
    pageInfo.textContent = `${page} / ${totalPages}`;
    totalPagesEl.textContent = `/ ${totalPages}`;
    pageInput.max = totalPages;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;
}

function flushProgress(page) {
    const { id_user } = getAuth();
    if (!id_user || !bookId) return;
    fetch(`${API_URL}/api/riwayat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_user: Number(id_user), id_buku: Number(bookId), halaman: page })
    }).catch(() => {});
}

function saveProgress(page) {
    const { id_user } = getAuth();
    if (!id_user || !bookId) return;
    if (saveProgressTimer) clearTimeout(saveProgressTimer);
    saveProgressTimer = setTimeout(() => flushProgress(page), 800);
}

function onPageVisible(pageNum) {
    currentPage = pageNum;
    updateProgress(pageNum);
    saveProgress(pageNum);
}

async function fetchSavedPage() {
    const { id_user } = getAuth();
    if (!id_user || !bookId) return 1;
    try {
        const res = await fetch(`${API_URL}/api/riwayat/${id_user}/${bookId}`);
        const data = await res.json();
        return Math.max(1, data.halaman || 1);
    } catch {
        return 1;
    }
}

async function logRiwayatBuka(halaman = 1) {
    const { id_user } = getAuth();
    if (!id_user || !bookId) return;
    fetch(`${API_URL}/api/riwayat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_user: Number(id_user), id_buku: Number(bookId), halaman: Number(halaman) || 1 })
    }).catch(() => {});
}

function observePages() {
    const observer = new IntersectionObserver(entries => {
        let topmost = null;
        let topmostTop = Infinity;
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const pageNum = Number(entry.target.dataset.page);
            queueRender(pageNum);
            const rect = entry.boundingClientRect;
            if (rect.top < topmostTop) {
                topmostTop = rect.top;
                topmost = pageNum;
            }
        });
        if (topmost !== null) {
            onPageVisible(topmost);
        }
    }, { rootMargin: '300px 0px', threshold: 0.01 });

    document.querySelectorAll('.pdf-page-wrapper').forEach(el => observer.observe(el));
}

async function renderPage(pageNum) {
    if (renderedPages.has(pageNum)) return;
    const wrapper = document.querySelector(`[data-page="${pageNum}"]`);
    if (!wrapper || !pdfDoc) return;

    renderedPages.add(pageNum);
    activeRenders++;

    try {
        const page = await pdfDoc.getPage(pageNum);
        const containerWidth = pdfContainer.clientWidth;
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / baseViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.setAttribute('aria-label', `Halaman ${pageNum}`);

        const ctx = canvas.getContext('2d');
        wrapper.classList.remove('lazy');
        wrapper.appendChild(canvas);

        await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
        console.error(`Render page ${pageNum} failed:`, err);
        const errMsg = document.createElement('p');
        errMsg.style.cssText = 'padding:20px;text-align:center;color:#ef4444;';
        errMsg.textContent = `Gagal memuat halaman ${pageNum}`;
        wrapper.appendChild(errMsg);
    } finally {
        activeRenders--;
    }
}

function queueRender(pageNum) {
    if (renderedPages.has(pageNum) || pageRenderQueue.has(pageNum)) return;
    pageRenderQueue.set(pageNum, true);
    pump();
}

function pump() {
    while (activeRenders < maxParallel && pageRenderQueue.size) {
        const next = pageRenderQueue.keys().next().value;
        pageRenderQueue.delete(next);
        renderPage(next);
    }
}

function queueRenderAll() {
    for (let i = 1; i <= totalPages; i++) queueRender(i);
}

function queueRenderAround(pageNum) {
    queueRender(pageNum);
    if (pageNum + 1 <= totalPages) queueRender(pageNum + 1);
    if (pageNum - 1 >= 1) queueRender(pageNum - 1);
}

function buildPageStubs() {
    pdfContainer.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'pdf-page-wrapper lazy';
        wrapper.dataset.page = i;
        const label = document.createElement('span');
        label.className = 'page-number-label';
        label.textContent = `${i}`;
        wrapper.appendChild(label);
        pdfContainer.appendChild(wrapper);
    }
}

function scrollToPage(pageNum) {
    const wrapper = document.querySelector(`[data-page="${pageNum}"]`);
    if (wrapper) {
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function jumpToPage(pageNum) {
    const target = Math.max(1, Math.min(totalPages, Number(pageNum) || 1));
    currentPage = target;
    updateProgress(target);
    saveProgress(target);
    queueRenderAround(target);
    scrollToPage(target);
}

async function loadPdf() {
    if (!bookId) {
        titleElement.textContent = 'ID buku tidak ditemukan';
        loadingOverlay.classList.add('hidden');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/books/${bookId}`);
        if (!res.ok) throw new Error('Buku tidak ditemukan');
        const book = await res.json();
        titleElement.textContent = book.judul;
        document.title = `${book.judul} - Pojok Baca`;

        const savedPage = await fetchSavedPage();
        await logRiwayatBuka(savedPage);
        const pdfUrl = `${API_URL}/api/books/${bookId}/pdf`;
        const pdfTask = pdfjsLib.getDocument({ url: pdfUrl, withCredentials: false });
        pdfDoc = await pdfTask.promise;
        totalPages = pdfDoc.numPages;

        buildPageStubs();
        updateProgress(savedPage);

        const initial = Math.min(savedPage, totalPages);
        queueRenderAround(initial);

        setTimeout(() => {
            if (initial > 1) scrollToPage(initial);
        }, 200);

        observePages();
        loadingOverlay.classList.add('hidden');
    } catch (err) {
        console.error(err);
        titleElement.textContent = 'Gagal memuat buku';
        loadingOverlay.querySelector('p').textContent = err.message;
    }
}

function flushOnUnload() {
    if (saveProgressTimer) {
        clearTimeout(saveProgressTimer);
        flushProgress(currentPage);
    }
}

backBtn.addEventListener('click', () => history.back());

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
    } else {
        document.exitFullscreen?.();
    }
});

prevBtn.addEventListener('click', () => {
    if (currentPage > 1) jumpToPage(currentPage - 1);
});

nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) jumpToPage(currentPage + 1);
});

pageInput.addEventListener('change', () => jumpToPage(pageInput.value));
pageInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') jumpToPage(pageInput.value);
});

let resizeTimer = null;
window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        pdfContainer.querySelectorAll('canvas').forEach(c => c.remove());
        pdfContainer.querySelectorAll('.pdf-page-wrapper').forEach(w => {
            if (!w.querySelector('p')) w.classList.add('lazy');
        });
        renderedPages.clear();
        queueRenderAround(currentPage);
    }, 500);
});

window.addEventListener('beforeunload', flushOnUnload);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushOnUnload();
});

loadPdf();