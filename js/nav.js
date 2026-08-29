/* js/nav.js
   Navigasi dropdown Pojok Baca (frontend only).
   Merender tombol menu + list vertikal (Home, Bookmark, Riwayat Baca, Logout)
   ke dalam elemen #navRoot yang ada di index/detail/bookmark. */

(function () {
    var root = document.getElementById('navRoot');
    if (!root) return;

    // ===== Proteksi halaman: cek login =====
    var token = localStorage.getItem('token');
    var userStorage = localStorage.getItem('user');
    if (!token || !userStorage) {
        alert('Akses ditolak! Silakan login terlebih dahulu.');
        window.location.href = 'login.html';
        return;
    }

    // ===== Ikon SVG (gaya garis Feather/Lucide) =====
    var ICON = {
        home: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        bookmark: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
        history: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 4v5h5"/><path d="M12 7v5l4 2"/></svg>',
        logout: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>',
        menu: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>'
    };

    var isIndex = window.location.pathname.indexOf('index.html') >= 0 || window.location.pathname === '/' || window.location.pathname.endsWith('/');

    function goRiwayat(e) {
        e.preventDefault();
        if (isIndex) {
            var section = document.getElementById('historySection');
            if (section) {
                window.location.hash = '';
                section.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.href = 'index.html#historySection';
            }
        } else {
            window.location.href = 'index.html#historySection';
        }
        closeMenu();
    }

    function doLogout(e) {
        e.preventDefault();
        localStorage.clear();
        alert('Berhasil logout!');
        window.location.href = 'login.html';
    }

    function closeMenu() {
        dropdown.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
    }

    function toggleMenu(e) {
        e.stopPropagation();
        var isOpen = dropdown.classList.contains('open');
        if (isOpen) {
            closeMenu();
        } else {
            dropdown.classList.add('open');
            menuBtn.setAttribute('aria-expanded', 'true');
        }
    }

    // ===== Susun elemen =====
    root.classList.add('nav-root');

    var menuBtn = document.createElement('button');
    menuBtn.type = 'button';
    menuBtn.className = 'nav-menu-btn';
    menuBtn.setAttribute('aria-label', 'Buka menu navigasi');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-haspopup', 'true');
    menuBtn.innerHTML = ICON.menu;

    var dropdown = document.createElement('div');
    dropdown.className = 'nav-dropdown';
    dropdown.setAttribute('role', 'menu');

    function makeLink(label, icon, href, cls) {
        var a = document.createElement('a');
        a.href = href;
        a.className = 'nav-item' + (cls ? ' ' + cls : '');
        a.setAttribute('role', 'menuitem');
        a.innerHTML = icon + '<span>' + label + '</span>';
        return a;
    }

    // Home
    dropdown.appendChild(makeLink('Home', ICON.home, 'index.html'));
    // Bookmark
    dropdown.appendChild(makeLink('Bookmark', ICON.bookmark, 'bookmark.html'));
    // Riwayat Baca -> scroll ke section di index
    var riwayat = makeLink('Riwayat Baca', ICON.history, isIndex ? '#historySection' : 'index.html#historySection');
    riwayat.addEventListener('click', goRiwayat);
    dropdown.appendChild(riwayat);
    // Logout
    var logout = makeLink('Logout', ICON.logout, '#', 'nav-logout');
    logout.addEventListener('click', doLogout);
    dropdown.appendChild(logout);

    root.appendChild(menuBtn);
    root.appendChild(dropdown);

    // ===== Event buka/tutup =====
    menuBtn.addEventListener('click', toggleMenu);

    document.addEventListener('click', function (e) {
        if (!root.contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
    });
})();
