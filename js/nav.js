/* js/nav.js
   Navigasi Pojok Baca (frontend only).
   - Desktop/Tablet: link navigasi horizontal (Home, Bookmark, Riwayat) + icon profil.
   - Mobile: hamburger (paling kanan) + icon profil di kirinya, link halaman di dropdown.
   - Icon profil membuka dropdown berisi nama akun, jumlah baca, jumlah bookmark, dan logout.
   Merender semuanya ke dalam elemen #navRoot di index/detail/bookmark. */

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

    var user = null;
    try { user = JSON.parse(userStorage); } catch (e) { user = null; }

    var API_URL = window.API_URL || 'https://pojokkbaca-production.up.railway.app';

    // ===== Ikon SVG (gaya garis Feather/Lucide) =====
    var ICON = {
        home: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        bookmark: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
        history: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 4v5h5"/><path d="M12 7v5l4 2"/></svg>',
        user: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        avatar: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
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
                window.location.href = 'index.html?riwayat=1';
            }
        } else {
            window.location.href = 'index.html?riwayat=1';
        }
        closeMobileMenu();
    }

    function doLogout(e) {
        e.preventDefault();
        localStorage.clear();
        alert('Berhasil logout!');
        window.location.href = 'login.html';
    }

    function refreshCounts() {
        if (!user || !user.id_user) return;
        var riwayatEl = document.getElementById('profileReading');
        var bookmarkEl = document.getElementById('profileBookmark');
        if (!riwayatEl || !bookmarkEl) return;

        var reading = fetch(API_URL + '/api/riwayat/' + user.id_user).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
        var bookmarks = fetch(API_URL + '/api/bookmarks/' + user.id_user).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });

        Promise.all([reading, bookmarks]).then(function (res) {
            riwayatEl.textContent = (res[0] && res[0].length) || 0;
            bookmarkEl.textContent = (res[1] && res[1].length) || 0;
        });
    }

    root.className = 'nav-root';

    // ===== Navigasi halaman (Home, Bookmark, Riwayat) =====
    var navLinks = document.createElement('nav');
    navLinks.className = 'nav-links';

    function makeNavLink(label, icon, href, handler) {
        var a = document.createElement('a');
        a.href = href;
        a.className = 'nav-link';
        a.innerHTML = icon + '<span>' + label + '</span>';
        if (handler) a.addEventListener('click', handler);
        return a;
    }

    var linkHome = makeNavLink('Home', ICON.home, 'index.html');
    var linkBookmark = makeNavLink('Bookmark', ICON.bookmark, 'bookmark.html');
    var linkRiwayat = makeNavLink('Riwayat', ICON.history, isIndex ? '#historySection' : 'index.html?riwayat=1', goRiwayat);
    navLinks.appendChild(linkHome);
    navLinks.appendChild(linkBookmark);
    navLinks.appendChild(linkRiwayat);
    root.appendChild(navLinks);

    // ===== Dropdown navigasi untuk mobile (hamburger) =====
    var menuBtn = document.createElement('button');
    menuBtn.type = 'button';
    menuBtn.className = 'nav-menu-btn';
    menuBtn.setAttribute('aria-label', 'Buka menu navigasi');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.innerHTML = ICON.menu;

    var mobileDropdown = document.createElement('div');
    mobileDropdown.className = 'nav-dropdown';
    mobileDropdown.setAttribute('role', 'menu');

    function makeMobileLink(label, icon, href, handler, cls) {
        var a = document.createElement('a');
        a.href = href;
        a.className = 'nav-item' + (cls ? ' ' + cls : '');
        a.setAttribute('role', 'menuitem');
        a.innerHTML = icon + '<span>' + label + '</span>';
        if (handler) a.addEventListener('click', handler);
        return a;
    }

    mobileDropdown.appendChild(makeMobileLink('Home', ICON.home, 'index.html'));
    mobileDropdown.appendChild(makeMobileLink('Bookmark', ICON.bookmark, 'bookmark.html'));
    mobileDropdown.appendChild(makeMobileLink('Riwayat Baca', ICON.history, isIndex ? '#historySection' : 'index.html?riwayat=1', goRiwayat));

    root.appendChild(menuBtn);
    root.appendChild(mobileDropdown);

    function closeMobileMenu() {
        mobileDropdown.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
    }

    menuBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = mobileDropdown.classList.contains('open');
        if (isOpen) { closeMobileMenu(); }
        else {
            mobileDropdown.classList.add('open');
            menuBtn.setAttribute('aria-expanded', 'true');
        }
    });

    // ===== Profil (icon + dropdown) =====
    var profileWrap = document.createElement('div');
    profileWrap.className = 'profile-wrap';

    var profileBtn = document.createElement('button');
    profileBtn.type = 'button';
    profileBtn.className = 'profile-btn';
    profileBtn.setAttribute('aria-label', 'Buka profil');
    profileBtn.setAttribute('aria-expanded', 'false');
    profileBtn.innerHTML = ICON.user;

    var profileDropdown = document.createElement('div');
    profileDropdown.className = 'profile-dropdown';

    var head = document.createElement('div');
    head.className = 'profile-head';
    head.innerHTML = '<span class="profile-avatar"></span><div class="profile-id"><span class="profile-name">' + (user && user.username ? user.username : 'Pengguna') + '</span><span class="profile-role">Akun saya</span></div>';
    head.querySelector('.profile-avatar').innerHTML = ICON.avatar;
    profileDropdown.appendChild(head);

    var stats = document.createElement('div');
    stats.className = 'profile-stats';
    stats.innerHTML =
        '<div class="profile-stat"><span class="profile-stat-label">Membaca</span><span class="profile-stat-value" id="profileReading">0</span></div>' +
        '<div class="profile-stat"><span class="profile-stat-label">Bookmark</span><span class="profile-stat-value" id="profileBookmark">0</span></div>';
    profileDropdown.appendChild(stats);

    var logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'profile-logout';
    logoutBtn.textContent = 'Logout';
    logoutBtn.addEventListener('click', doLogout);
    profileDropdown.appendChild(logoutBtn);

    profileWrap.appendChild(profileBtn);
    profileWrap.appendChild(profileDropdown);
    root.appendChild(profileWrap);

    function closeProfile() {
        profileDropdown.classList.remove('open');
        profileBtn.setAttribute('aria-expanded', 'false');
    }

    profileBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = profileDropdown.classList.contains('open');
        if (isOpen) { closeProfile(); }
        else {
            profileDropdown.classList.add('open');
            profileBtn.setAttribute('aria-expanded', 'true');
        }
    });

    // ===== Tutup dropdown saat klik di luar =====
    document.addEventListener('click', function (e) {
        if (!root.contains(e.target)) {
            closeMobileMenu();
            closeProfile();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
            closeProfile();
        }
    });

    // ===== Muat jumlah baca & bookmark =====
    refreshCounts();
})();
