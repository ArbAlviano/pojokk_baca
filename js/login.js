const API_URL = window.API_URL || 'http://localhost:5000';

let countdownInterval = null;
let isBlocked = false;

const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const btnLogin = document.querySelector('.btn-login');
const loginMessage = document.getElementById('loginMessage');

function setFormDisabled(disabled) {
    usernameInput.disabled = disabled;
    passwordInput.disabled = disabled;
    btnLogin.disabled = disabled;
    isBlocked = disabled;
}

function showMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = type || '';
}

function clearMessage() {
    loginMessage.textContent = '';
    loginMessage.className = '';
}

function startCountdown(seconds) {
    setFormDisabled(true);
    let remaining = seconds;
    localStorage.setItem('blockedUntil', String(Date.now() + seconds * 1000));

    showMessage(`Terlalu banyak percobaan gagal. Coba lagi dalam ${remaining} detik...`, 'warning');

    countdownInterval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            localStorage.removeItem('blockedUntil');
            setFormDisabled(false);
            clearMessage();
        } else {
            showMessage(`Terlalu banyak percobaan gagal. Coba lagi dalam ${remaining} detik...`, 'warning');
        }
    }, 1000);
}

const savedBlockUntil = parseInt(localStorage.getItem('blockedUntil') || '0', 10);
if (savedBlockUntil > Date.now()) {
    startCountdown(Math.ceil((savedBlockUntil - Date.now()) / 1000));
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isBlocked) return;

    const username = usernameInput.value;
    const password = passwordInput.value;

    clearMessage();

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.status === 429) {
            startCountdown(data.retryAfter || 60);
            return;
        }

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'index.html';
        } else {
            showMessage(data.message || 'Username atau password salah!', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Terjadi kesalahan, pastikan server Backend sudah aktif!', 'error');
    }
});
