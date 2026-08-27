/* js/login.js */
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Mencegah halaman refresh otomatis

    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    try {
        // Mengirim data login ke API server backend Node.js
        const response = await fetch('https://3h11btfg-5000.asse.devtunnels.ms/api/login', {
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
            alert("Login Berhasil!");
            
            // SIMPAN TOKEN DAN DATA USER KE BROWSER
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Alihkan user ke halaman utama (Home) setelah login sukses
            window.location.href = 'index.html'; 
        } else {
            // Menampilkan pesan gagal (misal: "Password salah!" atau "Username tidak ditemukan!")
            alert("Gagal: " + data.message); 
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan, pastikan server Backend Anda sudah aktif!");
    }
});
