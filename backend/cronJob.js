// backend/cronJob.js
import axios from 'axios';
import { checkAndStoreDomain } from './services/domainService.js';

console.log('🚀 [CRON] Rozpoczynam ręczne uruchomienie procesu aktualizacji...');

// Funkcja główna
async function run() {
  try {
    console.log('📥 Pobieram listę uwolnionych domen z dns.pl...');

    const response = await axios.get('https://www.dns.pl/deleted_domains.txt', {
      timeout: 30000,
      headers: {
        'User-Agent': 'DomenyTracker/1.0 (kontakt@uwolnionedomenty.pl)',
      },
      responseType: 'text',
    });

    console.log('✅ Pobrano dane. Przetwarzam...');

    const text = response.data;
    const lines = text.split('\n');

    console.log(`📄 Plik zawiera ${lines.length} linii.`);

    const domains = lines
      .map(line => line.trim().toLowerCase())
      .filter(line => line && line.endsWith('.pl') && line.length >= 5)
      

    console.log(`🔍 Filtr: wybrano ${domains.length} domen .pl do przetworzenia.`);

    if (domains.length === 0) {
      console.log('❌ Brak domen do przetworzenia. Sprawdź format pliku z dns.pl');
      return;
    }

    // Aktualna data z godziną (format DATETIME dla MySQL)
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Przetwarzaj po jednej domenie (by nie obciążać DNS i bazę)
    for (const domain of domains) {
      console.log(`🔍 Przetwarzam: ${domain}`);
      try {
        await checkAndStoreDomain(domain, now);
      } catch (err) {
        console.error(`❌ Błąd przetwarzania domeny ${domain}:`, err.message || err);
      }
    }

    console.log('✅ Wszystkie domeny przetworzone. Zakończono aktualizację.');
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.error('❌ Błąd połączenia: Nie można połączyć się z serwerem dns.pl – czy masz dostęp do internetu?');
    } else if (err.code === 'ETIMEDOUT') {
      console.error('❌ Błąd: Przekroczono limit czasu połączenia z dns.pl');
    } else if (err.response) {
      console.error('❌ Błąd HTTP:', err.response.status, err.response.statusText);
    } else {
      console.error('❌ Nieznany błąd:', err.message || err);
    }
  }
}

// Uruchom natychmiast (do testów)
run();