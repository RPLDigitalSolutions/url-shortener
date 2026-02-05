-- Schema untuk URL Shortener menggunakan SQLite
-- Tabel untuk menyimpan URL asli dan kode pendek

CREATE TABLE urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_url TEXT NOT NULL,
    short_code TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    clicks INTEGER DEFAULT 0
);

-- Indeks untuk mempercepat pencarian berdasarkan short_code
CREATE INDEX idx_short_code ON urls(short_code);