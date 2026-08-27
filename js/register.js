/* js/register.js */
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Mencegah halaman refresh otomatis

    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    try {
        // Mengirim data ke server backend Node.js (Port 5000)
        const response = await fetch('https://3h11btfg-5000.asse.devtunnels.ms/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput,
                password: passwordInput
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Registrasi Berhasil! Silakan lanjut login.");
            window.location.href = 'login.html'; // Berpindah ke halaman login
        } else {
            alert("Gagal: " + data.message); // Pesan error dari backend
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan, pastikan server Backend Anda sudah menyala!");
    }
});
