const axios = require('axios');

const RAPID_KEY = process.env.RAPIDAPI_KEY;
const RAPID_HOST = 'zillow-com1.p.rapidapi.com';
const HEADERS = { 'x-rapidapi-key': RAPID_KEY, 'x-rapidapi-host': RAPID_HOST };

async function searchAddress(address) {
  if (!RAPID_KEY) throw new Error('RAPIDAPI_KEY not set');

  const { data } = await axios.get('https://zillow-com1.p.rapidapi.com/searchAddress', {
    params: { q: address },
    headers: HEADERS,
    timeout: 15000,
  });

  // Returns array of results
  const results = Array.isArray(data) ? data : (data.results ?? []);
  return results.slice(0, 8).map((r) => ({
    id: r.zpid ?? r.id ?? String(Math.random()),
    name: r.streetAddress ?? r.address ?? address,
    subName: [r.city, r.state, r.zipcode].filter(Boolean).join(', '),
    url: r.url ?? '',
    propertyId: String(r.zpid ?? r.id ?? ''),
  })).filter((r) => r.propertyId);
}

async function getPropertyDetails(propertyId) {
  if (!RAPID_KEY) throw new Error('RAPIDAPI_KEY not set');

  const [propRes, schoolRes] = await Promise.allSettled([
    axios.get('https://zillow-com1.p.rapidapi.com/property', {
      params: { zpid: propertyId },
      headers: HEADERS,
      timeout: 15000,
    }),
    axios.get('https://zillow-com1.p.rapidapi.com/propertyExtendedSearch', {
      params: { zpid: propertyId },
      headers: HEADERS,
      timeout: 15000,
    }),
  ]);

  const prop = propRes.status === 'fulfilled' ? propRes.value.data : {};

  return normalizeZillow(propertyId, prop);
}

function normalizeZillow(propertyId, p) {
  const description = p.description ?? '';
  const amenities = extractAmenities(p);
  const hasPool = detectPool(amenities, description, p);
  const schools = extractSchools(p);

  return {
    propertyId,
    redfinUrl: p.url ? `https://www.zillow.com${p.url}` : null,
    address: {
      full: [p.streetAddress, p.unit].filter(Boolean).join(' '),
      city: p.city ?? '',
      state: p.state ?? '',
      zip: p.zipcode ?? '',
      lat: p.latitude ?? null,
      lng: p.longitude ?? null,
    },
    price: p.price ? `$${Number(p.price).toLocaleString()}` : null,
    priceRaw: p.price ?? null,
    beds: p.bedrooms ?? null,
    baths: p.bathrooms ?? null,
    sqft: p.livingArea ?? null,
    lotSqft: p.lotSize ?? null,
    yearBuilt: p.yearBuilt ?? null,
    daysOnMarket: p.daysOnZillow ?? null,
    status: p.homeStatus ?? null,
    pricePerSqft: p.pricePerSquareFoot ? `$${p.pricePerSquareFoot}` : null,
    schools,
    amenities,
    hasPool,
    photos: extractPhotos(p),
    description,
    walkScore: p.walkScore ?? null,
    walkScoreDescription: null,
    bikeScore: p.bikeScore ?? null,
    transitScore: p.transitScore ?? null,
  };
}

function extractAmenities(p) {
  const out = [];
  const atHome = p.atAGlanceFacts ?? [];
  for (const f of atHome) {
    out.push({ label: f.factLabel ?? '', content: f.factValue ?? '' });
  }
  const features = p.resoFacts?.homeFeatures ?? [];
  for (const f of features) {
    out.push({ label: f, content: '' });
  }
  return out;
}

function detectPool(amenities, description, p) {
  const re = /\bpool\b/i;
  return (
    re.test(description) ||
    amenities.some((a) => re.test(a.label) || re.test(a.content)) ||
    (p.resoFacts?.hasPrivatePool === true) ||
    (p.resoFacts?.hasSpa === true)
  );
}

function extractSchools(p) {
  const raw = p.schools ?? p.nearbySchools ?? [];
  return raw.map((s) => ({
    name: s.name ?? s.schoolName ?? '',
    level: levelFromGrades(s.grades ?? s.gradeRange ?? ''),
    rating: s.rating ?? null,
    distance: s.distance ?? null,
    grades: s.grades ?? s.gradeRange ?? '',
    servesHome: s.isAssigned ?? s.assigned ?? true,
    type: s.schoolType ?? s.type ?? '',
  }));
}

function levelFromGrades(grades) {
  const s = String(grades).toLowerCase();
  if (s.includes('k') || /^[pk]-[0-5]/.test(s) || s.includes('elementary')) return 'Elementary';
  if (/[6-8]/.test(s) || s.includes('middle')) return 'Middle';
  return 'High';
}

function extractPhotos(p) {
  const photos = p.photos ?? p.originalPhotos ?? [];
  return photos
    .slice(0, 12)
    .map((ph) => {
      if (typeof ph === 'string') return ph;
      return ph.mixedSources?.jpeg?.[0]?.url ?? ph.url ?? null;
    })
    .filter(Boolean);
}

module.exports = { searchAddress, getPropertyDetails };
