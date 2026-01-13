# Private Diary (Next.js)

A personal diary surface with panic PINs, adaptive blur, and mention-based referencing. Built on Next.js 16.

## Highlights

- **Dual PIN mode** – Master PIN unlocks the real diary; decoy PIN unlocks a safe timeline.
- **Smart blur system** – Blur the composer and timeline until you hover or hold a shortcut (`Ctrl + Alt + S`). Timeline blur supports per-entry reveal.
- **Mention workflow** – Add timeline entries as references in the composer; mention previews stay blurred and inherit text scaling.
- **Shortcut-driven text size** – Use `Ctrl + Shift + < / >` to shrink or enlarge composer/timeline text (including mentions) for shoulder-surfing protection.
- **Idle auto-lock** – When no activity is detected for `NEXT_PUBLIC_DIARY_IDLE_MINUTES` (default 1 minute), the app auto-locks and asks for the PIN again.
- **Keyboard navigation** – Arrow keys move between entries, Shift selects ranges, Delete opens the delete confirm modal, and `Ctrl + Alt + M` mentions the active entry.
- **Infinite timeline** – Scroll or use focus shortcuts; loading state and “jump to mention” search integration keep context intact.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Scripts

- `npm run dev` – start the development server
- `npm run build` – build the application for production
- `npm start` – run the built application
- `npm run lint` – run lint checks
- `npm run db` – run Turso dev server using `database-blue-xylophone.db` (port 8082)

## Diary mode

1. Copy `.env.example` ke `.env` dan set kredensial yang dibutuhkan. Variabel `DIARY_MASTER_PIN` / `DIARY_DECOY_PIN` bersifat opsional sekarang karena PIN bisa diatur langsung dari dashboard; nilai `.env` hanya dipakai sebagai fallback jika tabel PIN belum pernah diinisialisasi.
   - `TURSO_DATABASE_URL=libsql://127.0.0.1:8082` dan `TURSO_AUTH_TOKEN=local` saat memakai dev server.
   - `NEXT_PUBLIC_DIARY_IDLE_MINUTES` menentukan lama waktu tanpa aktivitas sebelum layar terkunci otomatis (set 0 untuk menonaktifkan).
2. Jalankan database lokal dengan `npm run db` lalu `npm run dev`.
3. Buat tabel jika belum ada (berlaku untuk Turso / SQLite):

```sql
CREATE TABLE IF NOT EXISTS diary_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  is_decoy INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS diary_pin_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  master_pin_hash TEXT NOT NULL,
  decoy_pin_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Cara pakai

- Atur master PIN dan (opsional) decoy PIN lewat dashboard `/dashboard` pada kartu **Master & decoy PIN**. Nilai disimpan aman di database.
- Saat aplikasi dibuka, masukkan PIN asli atau decoy. Tekan `Ctrl + K + L` kapan saja untuk memunculkan kunci lagi.
- Timeline otomatis mengikuti PIN yang dipakai. PIN asli bisa menulis ke diary asli ataupun decoy.
- Panel kanan menyediakan:
  - Pengaturan blur saat mengetik dan timeline blur.
  - Tombol untuk mengunci ulang, refresh, serta shortcut helper modal.
- Composer juga bisa diblur saat mengetik; tekan tombol **Lihat teks** untuk mengintip sementara.
- Mention preview dan composer mengikuti shortcut pembesar/kecil teks. Setiap mention di timeline bisa di-klik untuk mengisi pencarian tanpa menambah mention baru.
- Tidak ada aktivitas (klik/ketik/scroll) selama rentang yang ditentukan akan memicu auto-lock dan memunculkan overlay PIN.

---

This project is based on [Next.js](https://nextjs.org/).
