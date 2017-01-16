const express = require('express');

// Data models
const incidents = require('./precomputed/incidents.json');
const countries = require('./precomputed/countries.json');

// Routes
const router = express.Router();

// Get country data from ISO2
router.get('/country/:iso2', (req, res) => {
    const { iso2 } = req.params;
    const country = countries[iso2];
    res.json(country);
});

router.get('/incidents/:iso2', (req, res) => {
    const { iso2 } = req.params;
    const incs = incidents[iso2];
    if (!incs) return res.json([]);
    res.json(incs);
});

module.exports = router;
