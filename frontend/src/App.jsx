// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';

function App() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('available'); // 'available', 'taken', 'all'
  const [search, setSearch] = useState('');

  // Formatuje datę: 21.07.2025 14:35
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch (err) {
      console.error('Błąd formatowania daty:', err);
      return '–';
    }
  };

  // Pobieranie domen
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/domains');
        if (!response.ok) throw new Error('Błąd sieci');
        const data = await response.json();
        setDomains(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('❌ Błąd pobierania:', err);
        setDomains([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDomains();
  }, []);

  // Filtracja
  const filteredDomains = domains.filter((d) => {
    if (filter === 'available' && !d.is_available) return false;
    if (filter === 'taken' && d.is_available) return false;
    if (search && !d.domain.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Sortowanie: od najnowszych
  const sortedDomains = filteredDomains.sort((a, b) => {
    const dateA = new Date(a.first_seen);
    const dateB = new Date(b.first_seen);
    return dateB - dateA;
  });

  // Ręczne sprawdzenie domeny
  const handleCheckNow = async (domainName) => {
    try {
      const response = await fetch('http://localhost:3001/api/check-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainName }),
      });

      if (!response.ok) throw new Error('Błąd serwera');
      const updatedDomain = await response.json();

      // Zaktualizuj dane
      setDomains((prev) =>
        prev.map((d) => (d.domain === domainName ? updatedDomain : d))
      );

      // Znajdź komórkę statusu i dodaj animację
      const statusBadge = document.querySelector(`[data-status="${domainName}"]`);
      if (statusBadge) {
        statusBadge.classList.add('pulse');
        // Usuń klasę po zakończeniu animacji
        setTimeout(() => {
          statusBadge.classList.remove('pulse');
        }, 600);
      }
    } catch (err) {
      console.error('❌ Błąd sprawdzania domeny:', err);
    }
  };

  if (loading) {
    return <div className="loading">Ładowanie domen...</div>;
  }

  return (
    <div className="app">
      {/* Nagłówek */}
      <header className="header">
        <h1>UWOLNIONEDOMENY.PL</h1>
        <p>Domeny .pl, które zostały uwolnione i czekają na rejestrację</p>
      </header>

      {/* Filtry i wyszukiwanie */}
      <div className="controls">
        <input
          type="text"
          placeholder="Szukaj domeny..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <div className="filters">
          <button
            onClick={() => setFilter('available')}
            className={filter === 'available' ? 'filter-btn active' : 'filter-btn'}
          >
            Dostępne ({domains.filter(d => d.is_available).length})
          </button>
          <button
            onClick={() => setFilter('taken')}
            className={filter === 'taken' ? 'filter-btn active' : 'filter-btn'}
          >
            Zajęte ({domains.filter(d => !d.is_available).length})
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="table-container">
        <table className="domain-table">
          <thead>
            <tr>
              <th className="th-domain">Domena</th>
              <th>Uwolniona</th>
              {filter === 'available' ? (
              <th>Aktualizacja</th>
                  ) : (
                    <th>Zajęta od</th>
                  )}
              <th>Status</th>
              <th>Akcja</th>
            </tr>
          </thead>
          <tbody>
            {sortedDomains.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty">Brak pasujących domen</td>
              </tr>
            ) : (
              sortedDomains.map((d) => (
                <tr key={d.id} className={d.is_available ? 'available' : 'taken'}>
                  <td className="td-domain domain-cell">
                    <span className="domain-name" title={d.domain}>
                      {d.domain}
                    </span>
                  </td>
                  <td className="date-cell">{formatDate(d.first_seen)}</td>
                  <td className="td-last-checked last-checked-cell">
                    {filter === 'available'
                      ? formatDate(d.last_checked)
                      : d.taken_date ? formatDate(d.taken_date) : '–'
                    }
                  </td>
                  <td className="status-cell">
                    <span
                      className={`status-badge ${d.is_available ? 'available' : 'taken'}`}
                      data-status={d.domain}
                    >
                      {d.is_available ? 'DOSTĘPNA' : 'ZAJĘTA'}
                    </span>
                  </td>
                  <td className="action-cell">
                    <button
                      onClick={() => handleCheckNow(d.domain)}
                      className="check-btn"
                    >
                      🔍  Aktualizuj
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stopka */}
      <footer className="footer">
        Dane aktualizowane automatycznie | UWOLNIONEDOMENY.PL
      </footer>
    </div>
  );
}

export default App;