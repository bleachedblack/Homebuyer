const axios = require('axios');

const BASE = 'https://www.redfin.com/stingray';
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://www.redfin.com',
};

function parse(raw) {
  const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
  return JSON.parse(str.replace(/^\{\}&& ?/, ''));
}

async function get(url) {
  const res = await axios.get(url, { headers: HEADERS, timeout: 15000 });
  return parse(res.data);
}

async function searchAddress(address) {
  const json = await get(
    `${BASE}/do/location-autocomplete?location=${encodeURIComponent(address)}&v=2`
  );
  const rows = (json.payload?.sections ?? []).flatMap((s) => s.rows ?? []);
  return rows
    .filter((r) => r.type === 1)
    .map((r) => ({
      id: r.id,
      name: r.name,
      subName: r.subName,
      url: r.url,
      propertyId: (r.url?.match(/\/home\/(\d+)/) ?? [])[1] ?? null,
    }))
    .filter((r) => r.propertyId);
}

async function getPropertyDetails(propertyId) {
  const [above, below] = await Promise.allSettled([
    get(`${BASE}/api/home/details/aboveTheFold?propertyId=${propertyId}&accessLevel=1`),
    get(`${BASE}/api/home/details/belowTheFold?propertyId=${propertyId}`),
  ]);

  const ap = above.status === 'fulfilled' ? (above.value.payload ?? {}) : {};
  const bp = below.status === 'fulfilled' ? (below.value.payload ?? {}) : {};

  return normalizeProperty(propertyId, ap, bp);
}

function normalizeProperty(propertyId, ap, bp) {
  const basic = ap.basicSummary ?? {};
  const addr = ap.addressSectionInfo ?? {};
  const pubRec = ap.publicRecordsInfo ?? {};
  const transport = bp.transportationInfo ?? {};
  const description = ap.remarks?.listingRemarks ?? '';
  const amenities = extractAmenities(ap.amenitiesInfo);
  const photos = extractPhotos(ap.mediaBrowserInfo?.photos ?? []);

  const schools = (ap.schoolsAndDistrictsInfo?.schools ?? []).map((s) => ({
    name: s.name ?? '',
    level: s.levelCode === 'e' ? 'Elementary' : s.levelCode === 'm' ? 'Middle' : 'High',
    rating: s.rating ?? null,
    distance: s.distance ?? null,
    grades: s.grades ?? '',
    servesHome: s.servesHome ?? false,
    type: s.type ?? '',
  }));

  return {
    propertyId,
    redfinUrl: ap.url ? `https://www.redfin.com${ap.url}` : null,
    address: {
      full: addr.streetAddress?.assembledAddress ?? '',
      city: addr.city ?? '',
      state: addr.state ?? '',
      zip: addr.zip ?? '',
      lat: addr.latitude ?? null,
      lng: addr.longitude ?? null,
    },
    price: basic.price?.displayValue ?? null,
    priceRaw: basic.price?.value ?? null,
    beds: basic.beds ?? null,
    baths: basic.baths ?? null,
    sqft: basic.sqFt?.value ?? null,
    lotSqft: pubRec.lotSqFt ?? null,
    yearBuilt: pubRec.yearBuilt ?? null,
    daysOnMarket: ap.listingMetadata?.daysOnMarket ?? null,
    status: ap.listingMetadata?.statusType ?? null,
    pricePerSqft: basic.pricePerSqFt?.displayValue ?? null,
    schools,
    amenities,
    hasPool: detectPool(amenities, description),
    photos,
    description,
    walkScore: transport.walkScore?.value ?? null,
    walkScoreDescription: transport.walkScore?.description ?? null,
    bikeScore: transport.bikeScore?.value ?? null,
    transitScore: transport.transitScore?.value ?? null,
  };
}

function extractAmenities(amenitiesInfo) {
  if (!amenitiesInfo) return [];
  const results = [];
  for (const sg of amenitiesInfo.superGroups ?? []) {
    for (const a of sg.amenities ?? []) {
      results.push({
        label: a.redfin_label ?? a.header ?? '',
        content: a.content ?? '',
      });
    }
  }
  return results;
}

function extractPhotos(photos) {
  return photos
    .slice(0, 12)
    .map((p) => p.photoUrls?.fullScreenPhotoUrl ?? p.photoUrls?.url ?? null)
    .filter(Boolean);
}

function detectPool(amenities, description) {
  const re = /\bpool\b/i;
  return amenities.some((a) => re.test(a.label) || re.test(a.content)) || re.test(description);
}

module.exports = { searchAddress, getPropertyDetails };
