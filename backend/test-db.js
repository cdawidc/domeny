// backend/test-db.js
import mysql from 'mysql2/promise';

// Konfiguracja połączenia
const config = {
  host: process.env.DB_HOST,
  user: 'serwer373887_domeny',
  password: 'yglL1<3nEb>K-=6m', // ⚠️ ZAMIEN NA Swoje!
  database: 'serwer373887_domeny',
  port: 3306
};

async function testConnection() {
  console.log('🔌 Próbuję połączyć się z bazą danych...');

  try {
    // Utwórz połączenie
    const connection = await mysql.createConnection(config);
    console.log('✅ Połączenie z MySQL udane!');

    // Proste zapytanie
    const [rows] = await connection.execute('SELECT 1 + 1 AS result');
    console.log('🔢 Wynik zapytania:', rows[0].result); // powinno być 2

    // Sprawdź, czy widzimy tabelę `domains`
    const [tables] = await connection.execute("SHOW TABLES LIKE 'domains'");
    if (tables.length > 0) {
      console.log('🟢 Tabela `domains` istnieje!');
    } else {
      console.log('🟡 Tabela `domains` NIE istnieje! Uruchom skrypt SQL.');
    }

    // Zamknij połączenie
    await connection.end();
    console.log('👋 Połączenie zamknięte.');
  } catch (err) {
    console.error('❌ Błąd połączenia:', err.message);
    if (err.code) console.error('Kod błędu:', err.code);
  }
}

// Uruchom test
testConnection();