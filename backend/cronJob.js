// backend/cronJob.js
import axios from 'axios';
import { checkAndStoreDomains } from './services/domainService.js';

console.log('⏰ [CRON] Rozpoczynam proces aktualizacji domen...');

async function run() {
  try {
    console.log('📥 Pobieram listę uwolnionych domen z dns.pl...');
    const response = await axios.get('https://www.dns.pl/deleted_domains.txt', {
      timeout: 15000,
      headers: {
        'User-Agent': 'DomenyTracker/1.0 (kontakt@twojadomena.pl)'
      }
    });

    const domains = response.data
      .split('\n')
      .map(domain => domain.trim())
      .filter(domain => domain && domain.endsWith('.pl'));

    console.log(`✅ Pobrano ${domains.length} domen .pl`);

    if (domains.length === 0) {
      console.log('⚠️  Brak nowych domen do przetworzenia.');
      return;
    }

    console.log('🔄 Przetwarzam domeny i aktualizuję bazę...');
    await checkAndStoreDomains(domains);
    console.log('🎉 Aktualizacja zakończona pomyślnie!');
  } catch (err) {
    console.error('❌ Błąd podczas wykonywania zadania:', err.message);

    if (err.code) {
      console.error('🔍 Kod błędu:', err.code);
    }
    if (err.response) {
      console.error('📡 Status odpowiedzi:', err.response.status);
      console.error('📄 Treść błędu:', err.response.data.substring(0, 200));
    }
  }
}

// Uruchom natychmiast (dla testu)
run();

// Lub: zaplanuj codziennie o 3:00
// import cron from 'node-cron';
// cron.schedule('0 3 * * *', run);