// backend/services/dnsCheck.js
import { promises as dns } from 'dns';

// Prosta walidacja nazwy domeny
function isValidDomain(domain) {
  const regex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.pl$/i;
  return regex.test(domain);
}

export const isDomainAvailable = async (domain) => {
  // 1. Walidacja
  if (!domain || typeof domain !== 'string') {
    console.warn(`⚠️  Błąd: nieprawidłowy typ domeny:`, domain);
    return true; // zakładamy, że dostępna
  }

  domain = domain.trim().toLowerCase();

  if (!isValidDomain(domain)) {
    console.warn(`⚠️  Pomijam nieprawidłową domenę:`, domain);
    return true;
  }

  // 2. Sprawdzenie DNS
  try {
    await dns.resolve(domain, 'A');
    return false; // istnieje → zajęta
  } catch (err) {
    // Czasem err.message jest pusty – dlatego logujemy kod
    // console.log(`DNS lookup failed for ${domain}:`, err.code || 'unknown');
    return true; // brak rekordu → dostępna
  }
};