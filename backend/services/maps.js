const axios = require('axios');

const JPMC_DESTINATION = '8181 Communications Pkwy, Plano, TX 75024';
const KEY = process.env.GOOGLE_MAPS_API_KEY;

async function getLocationData(lat, lng) {
  if (!KEY) return null;

  const [commute, parks, coffee] = await Promise.allSettled([
    getCommuteMinutes(lat, lng),
    countNearbyPlaces(lat, lng, 'park', 1600),
    countNearbyPlaces(lat, lng, 'cafe', 1600),
  ]);

  return {
    commuteMinutes: commute.status === 'fulfilled' ? commute.value : null,
    nearbyParks: parks.status === 'fulfilled' ? parks.value : null,
    nearbyCoffee: coffee.status === 'fulfilled' ? coffee.value : null,
  };
}

async function getCommuteMinutes(lat, lng) {
  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
  url.searchParams.set('origins', `${lat},${lng}`);
  url.searchParams.set('destinations', JPMC_DESTINATION);
  url.searchParams.set('mode', 'driving');
  url.searchParams.set('departure_time', 'now');
  url.searchParams.set('key', KEY);

  const { data } = await axios.get(url.toString());
  const el = data.rows?.[0]?.elements?.[0];
  if (el?.status !== 'OK') return null;
  const secs = el.duration_in_traffic?.value ?? el.duration?.value;
  return secs ? Math.round(secs / 60) : null;
}

async function countNearbyPlaces(lat, lng, type, radius) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  url.searchParams.set('location', `${lat},${lng}`);
  url.searchParams.set('radius', String(radius));
  url.searchParams.set('type', type);
  url.searchParams.set('key', KEY);

  const { data } = await axios.get(url.toString());
  return data.results?.length ?? 0;
}

module.exports = { getLocationData };
