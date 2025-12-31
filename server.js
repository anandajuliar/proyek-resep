const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mysql = require('mysql2');
const crypto = require('crypto'); // PENTING: Buat bikin API Key acak

const app = express();
app.use(cors());
app.use(express.json()); // PENTING: Biar bisa baca data Register/Login

// API KEY SPOONACULAR KAMU
const MY_SPOONACULAR_KEY = '221763f9a87e4d64972ed240148f41d2'; 

// --- 1. KONEKSI DATABASE ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: 'Akusukses15!', // <--- Password kamu sudah benar disini
    database: 'resep_db'
});

// Cek koneksi saat server nyala
db.connect((err) => {
    if (err) {
        console.error('❌ Gagal Konek Database:', err.message);
    } else {
        console.log('✅ Terkoneksi ke Database MySQL!');
    }
});

// --- 2. ENDPOINT REGISTER (DAFTAR BARU) ---
app.post('/api/auth/register', (req, res) => {
    const { email, password } = req.body;
    
    // Bikin API Key unik (acak)
    const userApiKey = crypto.randomBytes(16).toString('hex');

    // Simpan ke Database
    const sql = 'INSERT INTO users (email, password, api_key) VALUES (?, ?, ?)';
    db.query(sql, [email, password, userApiKey], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ pesan: 'Gagal daftar. Email mungkin sudah dipakai.' });
        }
        // Kirim API Key ke user
        res.json({ 
            pesan: 'Registrasi Berhasil!', 
            apiKey: userApiKey 
        });
    });
});

// --- 3. ENDPOINT LOGIN ---
app.post('/api/auth/login', (req, res) => {
    const { email, password, apiKey } = req.body;

    // Cek apakah ada user dengan email, password, DAN api key tersebut
    const sql = 'SELECT * FROM users WHERE email = ? AND password = ? AND api_key = ?';
    db.query(sql, [email, password, apiKey], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ pesan: 'Error database' });
        }

        if (results.length > 0) {
            res.json({ status: 'sukses', user: results[0] });
        } else {
            res.status(401).json({ status: 'gagal', pesan: 'Email, Password, atau API Key salah!' });
        }
    });
});

// --- 4. ENDPOINT CARI RESEP ---
app.get('/api/cari-resep', async (req, res) => {
    try {
        const keywordUser = req.query.keyword;
        // Logika menambahkan filter Indonesian
        const urlSpoonacular = `https://api.spoonacular.com/recipes/complexSearch?query=${keywordUser}&cuisine=Indonesian&apiKey=${MY_SPOONACULAR_KEY}`;

        console.log(`User cari: ${keywordUser}`);
        
        const response = await axios.get(urlSpoonacular);
        res.json(response.data);

    } catch (error) {
        console.error(error);
        res.status(500).json({ pesan: "Duh, API Spoonacular error atau Key habis." });
    }
});

// --- 5. ENDPOINT DETAIL RESEP ---
app.get('/api/detail-resep/:id', async (req, res) => {
    try {
        const idResep = req.params.id;
        const urlDetail = `https://api.spoonacular.com/recipes/${idResep}/information?apiKey=${MY_SPOONACULAR_KEY}`;
        
        const response = await axios.get(urlDetail);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ pesan: "Gagal ambil detail resep" });
    }
});

// --- 3. ENDPOINT LOGIN ---
app.post('/api/auth/login', (req, res) => {
    const { email, password, apiKey } = req.body;

    // <--- TAMBAH 2 BARIS INI (BUAT NGINTIP DATA) --->
    console.log("👉 Data dari Frontend:", email, password, apiKey);
    
    // Cek apakah ada user dengan email, password, DAN api key tersebut
    const sql = 'SELECT * FROM users WHERE email = ? AND password = ? AND api_key = ?';
    db.query(sql, [email, password, apiKey], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ pesan: 'Error database' });
        }
        
        // <--- TAMBAH 1 BARIS INI JUGA --->
        console.log("👉 Hasil Pencarian Database:", results.length, "data ditemukan");

        if (results.length > 0) {
            res.json({ status: 'sukses', user: results[0] });
        } else {
            res.status(401).json({ status: 'gagal', pesan: 'Email, Password, atau API Key salah!' });
        }
    });
});

app.listen(3000, () => {
    console.log('Server jalan di http://localhost:3000');
});