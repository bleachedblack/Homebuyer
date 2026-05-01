const express = require('express');
const router = express.Router();
const { searchAddress, getPropertyDetails } = require('../services/redfin');
const { scoreProperty } = require('../services/scoring');
const { getLocationData } = require('../services/maps');

router.get('/search', async (req, res) => {
  const { address } = req.query;
  if (!address) return res.status(400).json({ error: 'address param required' });

  try {
    const results = await searchAddress(address);
    res.json(results);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(502).json({ error: 'Failed to search Redfin. Try again shortly.' });
  }
});

router.get('/details', async (req, res) => {
  const { propertyId } = req.query;
  if (!propertyId) return res.status(400).json({ error: 'propertyId required' });

  try {
    const property = await getPropertyDetails(propertyId);

    let mapsData = null;
    if (process.env.GOOGLE_MAPS_API_KEY && property.address.lat) {
      try {
        mapsData = await getLocationData(property.address.lat, property.address.lng);
      } catch (mapsErr) {
        console.warn('Maps API error (non-fatal):', mapsErr.message);
      }
    }

    const score = scoreProperty(property, mapsData);
    res.json({ ...property, score });
  } catch (err) {
    console.error('Details error:', err.message);
    res.status(502).json({ error: 'Failed to fetch property details from Redfin.' });
  }
});

// Debug endpoint — open in browser to diagnose Redfin connectivity
router.get('/debug', async (req, res) => {
  const axios = require('axios');
  const key = process.env.SCRAPER_API_KEY;
  const targetUrl =
    'https://www.redfin.com/stingray/do/location-autocomplete?location=dallas+tx&v=2';
  const fetchUrl = key
    ? `http://api.scraperapi.com/?api_key=${key}&url=${encodeURIComponent(targetUrl)}`
    : targetUrl;

  try {
    const result = await axios.get(fetchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      timeout: 20000,
    });
    res.json({
      scraperApiKeySet: !!key,
      httpStatus: result.status,
      dataPreview: String(result.data).slice(0, 300),
    });
  } catch (err) {
    res.json({
      scraperApiKeySet: !!key,
      error: err.message,
      httpStatus: err.response?.status ?? null,
      dataPreview: String(err.response?.data ?? '').slice(0, 300),
    });
  }
});

module.exports = router;
