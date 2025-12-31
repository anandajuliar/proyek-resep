const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors()); // Biar frontend bisa akses

// --- INI KUNCINYA (API KEY & LOGIC) ---
// Ganti tulisan ini dengan API KEY Spoonacular kamu nanti
const MY_SPOONACULAR_KEY = '221763f9a87e4d64972ed240148f41d2'; 

// Endpoint: Cari Resep
app.get('/api/cari-resep', async (req, res) => {
    try {
        // 1. Tangkap apa yang user ketik (misal: "Ayam")
        const keywordUser = req.query.keyword;

        // 2. LOGIKA LICIK KITA DISINI
        // Kita paksa tambahkan "&cuisine=Indonesian"
        // Jadi kalau user cari "Ayam", kita mintanya "Ayam Indonesian"
        const urlSpoonacular = `https://api.spoonacular.com/recipes/complexSearch?query=${keywordUser}&cuisine=Indonesian&apiKey=${MY_SPOONACULAR_KEY}`;

        console.log(`User cari: ${keywordUser}`);
        console.log(`Kita request ke API: ${urlSpoonacular}`);

        // 3. Tembak ke Spoonacular
        const response = await axios.get(urlSpoonacular);

        // 4. Kirim hasil (JSON) balik ke Frontend
        res.json(response.data);

    } catch (error) {
        console.error(error);
        res.status(500).json({ pesan: "Duh, API Spoonacular error atau Key habis." });
    }
});

app.get('/api/detail-resep/:id', async (req, res) => {
    try {
        const idResep = req.params.id;
        
        // Minta detail lengkap ke Spoonacular berdasarkan ID
        const urlDetail = `https://api.spoonacular.com/recipes/${idResep}/information?apiKey=${MY_SPOONACULAR_KEY}`;
        
        const response = await axios.get(urlDetail);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ pesan: "Gagal ambil detail resep" });
    }
});

app.listen(3000, () => {
    console.log('Server jalan di http://localhost:3000');
});