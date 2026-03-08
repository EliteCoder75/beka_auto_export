/**
 * BEKA AUTO EXPORT — API véhicules
 * Charge les véhicules depuis Netlify Functions
 * Endpoint : /.netlify/functions/vehicles?categorie=neuf|export|france
 */

const _cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 min

async function loadFromAPI(categorie) {
    const url = categorie
        ? `/.netlify/functions/vehicles?categorie=${categorie}`
        : `/.netlify/functions/vehicles`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.vehicles || [];
    } catch {
        return [];
    }
}

// categorie = 'neuf' | 'export' | 'france' | null (tous)
async function getAllVehicles(categorie) {
    const key = categorie || '_all';
    const now = Date.now();
    if (_cache[key] && (now - _cache[key].ts < CACHE_TTL)) {
        return _cache[key].data;
    }
    const vehicles = await loadFromAPI(categorie);
    _cache[key] = { data: vehicles, ts: now };
    return vehicles;
}

async function getFeaturedVehicles(limit = 6) {
    const all = await getAllVehicles(null);
    return all
        .filter(v => v.disponibilite !== 'vendu')
        .sort(() => Math.random() - 0.5)
        .slice(0, limit);
}
