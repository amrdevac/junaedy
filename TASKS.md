# Project Brainstorming: Junaedy

## Ringkasan Ide
- Aplikasi bank kosakata Mandarin dari materi belajar (mis. Duolingo), menyimpan kata baru, dan menyediakan kuis acak dari data sendiri.

## Masalah Yang Ingin Diselesaikan
- Sulit mengingat kosakata yang sudah dipelajari karena tidak ada daftar kata.
- Ingin latihan/kuis berbasis data sendiri (bukan materi umum).

## Target Pengguna
- Pelajar Mandarin pemula yang belajar lewat aplikasi seperti Duolingo dan ingin mengelola kosakata sendiri.

## Value Proposition
- Punya bank kata pribadi yang rapi, otomatis mendeteksi kata baru, dan kuis adaptif dari kosakata sendiri.

## Fitur Inti (Core)
- [ ] Form input per kata: Hanzi + Arti Indonesia (manual).
- [ ] Input kalimat/teks Mandarin dan pemecahan kata (tokenisasi) untuk cek kata baru vs sudah ada.
- [ ] Simpan kata baru ke bank kosakata.
- [ ] Kuis fleksibel (jumlah soal bisa diatur): Hanzi -> Indonesia dan Indonesia -> Hanzi.
- [ ] Mode kuis: random otomatis dan mode custom (user seting sendiri).
- [ ] Pola selang-seling dengan prioritas kata baru (kata baru dapat porsi 3-4x, definisi kata baru = dalam 3 hari).

## Fitur Pendukung (Nice-to-have)
- [ ] Tag/label sumber belajar (Duolingo/lesson tertentu).
- [ ] Riwayat kuis dan skor.
- [ ] Review terjadwal untuk kata baru (3 hari ke depan).
- [ ] Presentasi/evaluasi: kata/kalimat yang paling sering dipelajari vs jarang dipelajari.

## MVP Scope
- [ ] CRUD kosakata (Hanzi, Arti Indonesia).
- [ ] Deteksi kata baru dari input kalimat sederhana.
- [ ] Kuis dua arah dengan jumlah soal yang bisa diatur dan prioritas kata baru.
- [ ] Statistik sederhana frekuensi belajar (sering vs jarang) untuk evaluasi.

## Non-Goals
- Tidak menggantikan kurikulum belajar; fokus pada manajemen kosakata pribadi.

## Alur Utama (User Flow)
- User input kalimat -> sistem tokenisasi -> cek kata yang sudah ada -> simpan kata baru.
- User pilih kuis -> sistem ambil 10 soal acak -> user jawab -> hasil.
 - Form input Hanzi (multi-step):
 - Input kalimat Hanzi -> klik `Slice/Pisahkan` -> default slice per karakter.
 - Sistem generate form per token: input Hanzi + input arti.
 - Token bisa dihapus atau digabung manual oleh user sebelum simpan.
 - Jika token sudah ada di DB, tampilkan form read-only dengan arti yang sudah tersimpan.

## Data & Konten
- Sumber data: Input user (manual Hanzi + Arti).
- Penyimpanan: IndexedDB.
- Privasi: Data lokal, tidak dibagikan.

## Integrasi Eksternal
- Opsional: dictionary API untuk pinyin/arti (jika user tidak input manual).

## Risiko & Asumsi
- Tokenisasi Mandarin bisa salah untuk frasa tertentu (perlu strategi sederhana di MVP).
- Arti Indonesia bergantung input manual.
 - Statistik bergantung pada pencatatan histori kuis (tanggal dan benar/salah).

## Milestone Awal
1. Skema database kosakata + CRUD dasar.
2. Fitur input kalimat dan deteksi kata baru.
3. Kuis acak 10 soal dua arah.

## Pertanyaan Terbuka
- Definisi "kata sudah ada": berdasarkan Hanzi saja.
- Penjadwalan "kata baru 3 hari ke depan": masuk ke daftar review harian selama 3 hari.
