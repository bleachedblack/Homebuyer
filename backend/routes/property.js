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

// Debug endpoint — open in browser to diagnose API connectivity
router.get('/debug', async (req, res) => {
  const axios = require('axios');
  const key = process.env.RAPIDAPI_KEY;
  try {
    const result = await axios.get('https://zillow-com1.p.rapidapi.com/searchAddress', {
      params: { q: 'Dallas TX' },
      headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': 'zillow-com1.p.rapidapi.com' },
      timeout: 15000,
    });
    res.json({
      rapidApiKeySet: !!key,
      httpStatus: result.status,
      dataPreview: JSON.stringify(result.data).slice(0, 400),
    });
  } catch (err) {
    res.json({
      rapidApiKeySet: !!key,
      error: err.message,
      httpStatus: err.response?.status ?? null,
      dataPreview: String(err.response?.data ?? '').slice(0, 300),
    });
  }
});

module.exports = router;
