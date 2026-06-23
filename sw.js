// ==========================================
// AICE KRISTAL SUPER APP - SERVICE WORKER
// ==========================================

const CACHE_NAME = "aice-kristal-v1.0.0"; // Ubah versi ini jika Anda melakukan perubahan besar pada kodingan

// Daftar file yang WAJIB disimpan di memori HP agar bisa dibuka saat tidak ada internet
const urlsToCache = [
    "./",
    "./index.html",
    "./styles.css",
    "./app.js",
    "./manifest.json",
    
    // Ikon Aplikasi (Pastikan file ini ada di folder yang sama, atau hapus baris ini jika tidak menggunakan ikon lokal)
    "./icon-192x192.png", 
    "./icon-512x512.png",
    
    // Pustaka Eksternal yang sering dipakai (CDN)
    "https://cdn.tailwindcss.com",
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
    "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",
    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
];

// 1. INSTALASI SERVICE WORKER (Simpan Cache Pertama Kali)
self.addEventListener("install", event => {
    // Memaksa Service Worker baru untuk langsung mengontrol halaman tanpa menunggu tab ditutup
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log("[Service Worker] Menyimpan Cache Dasar: ", CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error("[Service Worker] Gagal menyimpan cache dasar", err);
            })
    );
});

// 2. AKTIVASI (Hapus Cache Versi Lama Jika Ada Update)
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Jika nama cache tidak sama dengan CACHE_NAME saat ini, maka hapus yang lama
                    if (cacheName !== CACHE_NAME && cacheName.startsWith("aice-kristal-v")) {
                        console.log("[Service Worker] Menghapus Cache Lama: ", cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Memaksa Service Worker untuk langsung mengambil alih semua tab yang terbuka
            return self.clients.claim();
        })
    );
});

// 3. STRATEGI FETCHING DATA (Network First, fallback to Cache)
self.addEventListener("fetch", event => {
    // 3.1. Lewati permintaan ke Google Apps Script (API) agar selalu mengambil data segar dari server jika online
    if (event.request.url.includes("script.google.com")) {
        return; 
    }

    // 3.2. Cegah caching untuk permintaan POST (seperti mengirim data formulir)
    if (event.request.method !== 'GET') {
        return;
    }

    // 3.3. Logika Utama: Coba ambil dari Internet (Network), jika gagal (Offline), ambil dari Memori HP (Cache)
    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                // Jika berhasil ambil dari internet, simpan/perbarui salinannya di Cache (Dinamis)
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    let responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Jika jaringan mati (Offline), cari file tersebut di dalam Cache
                console.log("[Service Worker] Offline Mode: Menyajikan dari cache untuk URL:", event.request.url);
                return caches.match(event.request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Jika tidak ada di internet DAN tidak ada di cache, biarkan sistem menangani error secara default
                });
            })
    );
});

// 4. MENDENGARKAN PESAN DARI APP.JS (Untuk fitur Auto-Update Versi)
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
