const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Vercel serverless hanya memiliki izin tulis di folder /tmp
const tmpDbPath = path.join('/tmp', 'database.sqlite');

// Inisialisasi database di /tmp
const db = new sqlite3.Database(tmpDbPath, (err) => {
    if (err) {
        console.error('Gagal terhubung ke database:', err.message);
    }
});

// Buat tabel jika belum ada
db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    pesan TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

export default function handler(req, res) {
    // Izinkan CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Handle POST Request (Kirim Pesan)
    if (req.method === 'POST') {
        const { nama, whatsapp, pesan } = req.body || {};

        if (!nama || !whatsapp || !pesan) {
            return res.status(400).json({ success: false, message: 'Semua field harus diisi!' });
        }

        const query = `INSERT INTO contacts (nama, whatsapp, pesan) VALUES (?, ?, ?)`;
        db.run(query, [nama, whatsapp, pesan], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Gagal menyimpan ke database.' });
            }
            return res.status(201).json({ 
                success: true, 
                message: 'Pesan berhasil dikirim!',
                data: { id: this.lastID, nama, whatsapp, pesan }
            });
        });
    } 
    // Handle GET Request (Melihat daftar pesan / Admin)
    else if (req.method === 'GET') {
        db.all(`SELECT * FROM contacts ORDER BY created_at DESC`, [], (err, rows) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Gagal mengambil data.' });
            }
            return res.status(200).json({ success: true, data: rows });
        });
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}