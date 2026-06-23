// Konfigurasi Endpoint GAS Anda (Ganti dengan URL hasil deploy Code.gs Anda)
const API_URL = "https://script.google.com/macros/s/AKfycbxkW8fIM27avrLKbWuaFxBhvDRs07VbQ0HaB6-fnt9wDCC70WynBCwtC6dFxeGvFkQR3A/exec";
let currentPin = "";

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log("Service Worker Terdaftar"))
        .catch(err => console.error("SW Gagal", err));
}

// PIN Logic
function updatePinDisplay() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('filled', index < currentPin.length);
    });
}

function inputPin(num) {
    if (currentPin.length < 6) {
        currentPin += num;
        updatePinDisplay();
    }
}

function clearPin() {
    currentPin = "";
    updatePinDisplay();
}

async function submitPin() {
    if (currentPin.length === 6) {
        // Tampilkan indikator loading (Bisa ditambahkan UI animasi loading)
        try {
            const response = await fetch(`${API_URL}?action=login&pin=${currentPin}`);
            const result = await response.json();
            
            if (result.status === "success") {
                sessionStorage.setItem("userSession", JSON.stringify(result.user));
                document.getElementById("user-greeting").innerText = `Halo, ${result.user.nama}`;
                document.getElementById("login-screen").classList.remove("active");
                document.getElementById("dashboard-screen").classList.add("active");
            } else {
                alert("PIN Salah atau Akses Ditolak");
                clearPin();
            }
        } catch (error) {
            // Mode Offline Fallback (Cek cache / IndexedDB di pengembangan lebih lanjut)
            alert("Sistem Offline. Mencoba masuk ke mode lokal...");
        }
    }
}

function logout() {
    sessionStorage.removeItem("userSession");
    currentPin = "";
    updatePinDisplay();
    document.getElementById("dashboard-screen").classList.remove("active");
    document.getElementById("login-screen").classList.add("active");
}
