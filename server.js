const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mysql = require('mysql2');
const crypto = require('crypto'); 

const app = express();
app.use(cors());
app.use(express.json()); 

// --- KONFIGURASI ---
const MY_SPOONACULAR_KEY = '221763f9a87e4d64972ed240148f41d2'; 
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: 'Akusukses15!', // Sesuaikan password DB kamu
    database: 'resep_db'
});

db.connect((err) => {
    if (err) console.error('❌ Gagal Konek Database:', err.message);
    else console.log('✅ Terkoneksi ke Database MySQL!');
});

// --- MIDDLEWARE: CEK API KEY ---
const cekApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ pesan: 'Mana API Key-nya? (Header x-api-key kosong)' });

    const sql = 'SELECT * FROM users WHERE api_key = ?';
    db.query(sql, [apiKey], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database Error' });
        if (results.length === 0) return res.status(403).json({ pesan: 'API Key TIDAK VALID!' });

        req.user = results[0]; 
        next(); 
    });
};

// --- ROUTES AUTH ---

// 1. REGISTER
app.post('/api/auth/register', (req, res) => {
    const { email, password } = req.body;
    const userApiKey = crypto.randomBytes(16).toString('hex');

    const sql = 'INSERT INTO users (email, password, role, api_key) VALUES (?, ?, "user", ?)';
    db.query(sql, [email, password, userApiKey], (err, result) => {
        if (err) return res.status(500).json({ pesan: 'Email sudah terdaftar!' });
        res.json({ 
            pesan: 'Registrasi Berhasil!', 
            data: { email, role: 'user', apiKey: userApiKey }
        });
    });
});

// 2. LOGIN (PAKAI CEK API KEY)
app.post('/api/auth/login', (req, res) => {
    const { email, password, apiKey } = req.body; // Terima API Key dari input user

    const sql = 'SELECT * FROM users WHERE email = ? AND password = ? AND api_key = ?';
    db.query(sql, [email, password, apiKey], (err, results) => {
        if (err) return res.status(500).json({ pesan: 'Error database' });

        if (results.length > 0) {
            res.json({ status: 'sukses', user: results[0] });
        } else {
            res.status(401).json({ status: 'gagal', pesan: 'Login Gagal! Email, Password, atau API Key salah.' });
        }
    });
});

// --- ROUTES DATA (Client User Web Lain) ---

// 3. CARI RESEP
app.get('/api/cari-resep', cekApiKey, async (req, res) => {
    try {
        const keywordUser = req.query.keyword;
        const urlSpoonacular = `https://api.spoonacular.com/recipes/complexSearch?query=${keywordUser}&cuisine=Indonesian&apiKey=${MY_SPOONACULAR_KEY}`;
        
        const response = await axios.get(urlSpoonacular);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ pesan: "Limit Spoonacular habis atau error." });
    }
});

// 4. DETAIL RESEP
app.get('/api/detail-resep/:id', cekApiKey, async (req, res) => {
    try {
        const idResep = req.params.id;
        const urlDetail = `https://api.spoonacular.com/recipes/${idResep}/information?apiKey=${MY_SPOONACULAR_KEY}`;
        const response = await axios.get(urlDetail);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ pesan: "Gagal ambil detail resep" });
    }
});

// --- ROUTES ADMIN ---
app.get('/api/admin/users', cekApiKey, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ pesan: "Bukan Admin!" });

    db.query('SELECT id, email, role, api_key FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ pesan: "Data Semua User", data: results });
    });
});

app.listen(3000, () => {
    console.log('Server jalan di http://localhost:3000');
});