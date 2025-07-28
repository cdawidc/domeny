// backend/services/domainService.js
import pool from '../db.js';
import { isDomainAvailable } from './dnsCheck.js';

/**
 * Główna funkcja: przetwarza listę domen z dns.pl
 * - Dodaje nowe
 * - Aktualizuje istniejące
 * - Sprawdza, czy nadal są dostępne
 */
export const checkAndStoreDomains = async (domains) => {
  const today = new Date().toISOString().split('T')[0]; // format YYYY-MM-DD

  console.log(`🔄 Rozpoczynam przetwarzanie ${domains.length} domen...`);

  for (const domainName of domains) {
    try {
      // 1. Walidacja wejścia
      if (!domainName || typeof domainName !== 'string') {
        console.warn(`⚠️  Pomijam nieprawidłową wartość domeny:`, domainName);
        continue;
      }

      const domain = domainName.trim().toLowerCase();

      if (domain.length < 4 || !domain.endsWith('.pl')) {
        console.warn(`⚠️  Pomijam nieprawidłową domenę (krótka/lub nie .pl):`, domain);
        continue;
      }

      // 2. Sprawdź, czy już istnieje w bazie
      const [rows] = await pool.execute('SELECT * FROM domains WHERE domain = ?', [domain]);
      const existing = rows[0];

      // 3. Sprawdź, czy domena jest aktualnie dostępna (czy ktoś jej nie zarejestrował)
      const available = await isDomainAvailable(domain);

      if (!existing) {
        // ✅ Nowa domena — dodajemy
        await pool.execute(
          `INSERT INTO domains (domain, released_date, last_checked, is_available, days_available)
           VALUES (?, ?, ?, ?, 1)`,
          [domain, today, today, available]
        );
        console.log(`✅ NOWA: ${domain} | Dostępna: ${available}`);
      } else {
        // 🔁 Istniejąca — aktualizujemy
        const wasAvailable = existing.is_available === 1;
        const shouldIncrement = wasAvailable && available; // tylko jeśli była i nadal jest wolna
        const newDays = shouldIncrement ? existing.days_available + 1 : existing.days_available;

        await pool.execute(
          `UPDATE domains
           SET last_checked = ?, is_available = ?, days_available = ?
           WHERE domain = ?`,
          [today, available, newDays, domain]
        );

        if (!wasAvailable && available) {
          console.log(`🔄 POWRÓT: ${domain} była zajęta, teraz wolna ponownie | Dni: ${newDays}`);
        } else if (wasAvailable && !available) {
          console.log(`🔒 ZAJĘTA: ${domain} została zarejestrowana po ${existing.days_available} dniach`);
        } else {
          console.log(`🔁 Aktualizacja: ${domain} | Dostępna: ${available} | Dni: ${newDays}`);
        }
      }
    } catch (err) {
      console.error(`❌ BŁĄD PRZY DOMENIE: ${domainName}`);
      console.error('🔍 Kod błędu:', err.code || 'brak');
      console.error('📝 Wiadomość:', err.message || 'brak');
      console.error('📊 Szczegóły:', err);
    }
  }

  console.log('✅ Wszystkie domeny zostały przetworzone.');
};