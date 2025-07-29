// backend/services/domainService.js
import pool from '../db.js';
import { isDomainAvailable } from './dnsCheck.js';

const getLocalDateTime = () => {
  const now = new Date();
  
  // Dodaj 2 godziny, jeśli chcesz CEST (lub użyj poniższego uniwersalnego)
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const checkAndStoreDomain = async (domainName) => {
  const now = getLocalDateTime();
  const domain = domainName.trim().toLowerCase();

  // Walidacja
  if (!domain || !domain.endsWith('.pl') || domain.length < 5) {
    console.log(`⚠️ Pomijam: ${domainName}`);
    return;
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM domains WHERE domain = ?', [domain]);
    const existing = rows[0];
    const available = await isDomainAvailable(domain);

    if (!existing) {
      // Nowa domena
      await pool.execute(
        `INSERT INTO domains (domain, first_seen, last_checked, is_available)
         VALUES (?, ?, ?, ?)`,
        [domain, now, now, available]
      );
      console.log(`✅ NOWA: ${domain} | Dostępna: ${available} | Dodano: ${now}`);
    } else {
      // Aktualizuj tylko last_checked i status
      await pool.execute(
        `UPDATE domains
         SET last_checked = ?, is_available = ?
         WHERE domain = ?`,
        [now, available, domain]
      );

      if (existing.is_available && !available) {
        console.log(`🔒 ZAJĘTA: ${domain} została zarejestrowana | Dodano: ${existing.first_seen} | Zmieniono: ${now}`);
      } else {
        console.log(`🔁 Aktualizacja: ${domain} | Status: ${available ? 'wolna' : 'zajęta'} | Czas: ${now}`);
      }
    }
  } catch (err) {
    console.error(`❌ Błąd dla ${domain}:`, err.message);
  }
};