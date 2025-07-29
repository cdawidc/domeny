// backend/server.js
import express from 'express';
import cors from 'cors';
import pool from './db.js';
import { isDomainAvailable } from './services/dnsCheck.js';

const app = express();
const PORT = 3001;

// Włącz CORS i parsowanie JSON
app.use(cors());
app.use(express.json());

// 🔹 Trasa: pobierz domeny (opcjonalnie z filtrem)
app.get('/api/domains', async (req, res) => {
  try {
    let query = 'SELECT * FROM domains';
    const params = [];

    // Filtr: dostępne / zajęte
    const { available } = req.query;
    if (available === 'true') {
      query += ' WHERE is_available = 1';
    } else if (available === 'false') {
      query += ' WHERE is_available = 0';
    }

    // Sortowanie: od najnowszych (najpierw dodane)
    query += ' ORDER BY first_seen DESC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error('❌ Błąd w /api/domains:', err);
    res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
  }
});

// 🔹 Trasa testowa – sprawdź, czy API działa
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Serwer działa!' });
});

// 🔁 Trasa: ręczne sprawdzenie domeny
app.post('/api/check-domain', async (req, res) => {
  const { domain } = req.body;

  if (!domain || !domain.endsWith('.pl')) {
    return res.status(400).json({ error: 'Nieprawidłowa domena (wymagane .pl)' });
  }

  try {
    const available = await isDomainAvailable(domain);

    // Aktualizuj tylko: last_checked i is_available
    await pool.execute(
      `UPDATE domains 
       SET last_checked = NOW(), is_available = ? 
       WHERE domain = ?`,
      [available, domain]
    );

    // Pobierz zaktualizowaną domenę
    const [rows] = await pool.execute('SELECT * FROM domains WHERE domain = ?', [domain]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Domena nie znaleziona w bazie' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Błąd sprawdzania domeny:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Uruchom serwer
app.listen(PORT, () => {
  console.log(`🚀 API działa na http://localhost:${PORT}`);
  console.log(`👉 Test API: http://localhost:${PORT}/api/health`);
  console.log(`👉 Domeny: http://localhost:${PORT}/api/domains`);
});