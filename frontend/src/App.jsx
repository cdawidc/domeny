import { useEffect, useState } from 'react';
import './index.css';

function App() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/domains?available=true&sort=days')
      .then(r => r.json())
      .then(data => {
        setDomains(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Błąd ładowania:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Ładowanie domen...</p>;

  return (
    <div className="container">
      <h1>🔥 Dostępne domeny .pl</h1>
      <p className="subtitle">Lista domen, które zostały uwolnione i wisią</p>

      <table className="domain-table">
        <thead>
          <tr>
            <th>Domena</th>
            <th>Wisi od</th>
            <th>Dni</th>
          </tr>
        </thead>
        <tbody>
          {domains.map(d => (
            <tr key={d.id}>
              <td><strong>{d.domain}</strong></td>
              <td>{d.released_date}</td>
              <td className="days">{d.days_available}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;