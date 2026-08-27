// js/theme.js
// Tema Pojok Baca: auto ikut sistem OS + toggle manual (tersimpan di localStorage)
(function () {
    var STORAGE_KEY = 'pojok-baca-theme';

    function getPreferredTheme() {
        var saved = null;
        try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
        if (saved === 'dark' || saved === 'light') return saved;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // Ikon SVG bergaya garis tipis (Feather/Lucide), stroke mengikuti warna tombol
    var ICON_SUN = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
    var ICON_MOON = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';

    function updateToggleIcons(theme) {
        var buttons = document.querySelectorAll('.theme-toggle');
        var icon = theme === 'dark' ? ICON_SUN : ICON_MOON;
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].innerHTML = icon;
        }
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        updateToggleIcons(theme);
    }

    // Terapkan tema SEBELUM halaman dirender agar tidak terjadi kedipan (FOUC)
    applyTheme(getPreferredTheme());

    // Ikuti perubahan pengaturan OS selama user belum memilih manual
    if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        var onSystemChange = function (e) {
            var saved = null;
            try { saved = localStorage.getItem(STORAGE_KEY); } catch (err) {}
            if (!saved) applyTheme(e.matches ? 'dark' : 'light');
        };
        if (mq.addEventListener) {
            mq.addEventListener('change', onSystemChange);
        } else if (mq.addListener) {
            mq.addListener(onSystemChange);
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        var buttons = document.querySelectorAll('.theme-toggle');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function () {
                var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
                applyTheme(next);
            });
        }
        updateToggleIcons(document.documentElement.getAttribute('data-theme') || 'light');
    });
})();
