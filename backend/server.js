import express from 'express';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/api/domains', async (req, res) => {
  const { available, sort } = req.query;
  let query = 'SELECT * FROM domains';
  const params = [];

  if (available === 'true') {
    query += ' WHERE is_available = 1';
  } else if (available === 'false') {
    query += ' WHERE is_available = 0';
  }

  if (sort === 'days') {
    query += ' ORDER BY days_available DESC';
  } else {
    query += ' ORDER BY released_date DESC';
  }

  try {
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API działa na http://localhost:${PORT}`);
});