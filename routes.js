const express = require('express');
const Promise = require('Bluebird');
const _ = require('lodash')
const geolib = require('geolib');
const csv = require('csv-express');

const writeResponse = (res, data, format) => {
    if (format == 'csv') {
        res.csv(data, true)
    } else {
        res.json(data);
    }
}

const inRange = (a, b, r) => {
    return geolib.isPointInCircle(
        {latitude: a.latitude, longitude: a.longitude},
        {latitude: b.latitude, longitude: b.longitude},
        r
    )
}

const connector = (db) => {
    const router = express.Router();

    const Cities = db.collection('cities');
    const Countries = db.collection('countries');

    router.get('/world', (req, res) => {
        const from = parseInt(req.query.from);
        const to = parseInt(req.query.to);
        const minCas = parseInt(req.query.minCas);
        const minInc = parseInt(req.query.minInc);
        const range = parseInt(req.query.range) * 1000;
        Countries.find().map((country) => {
            const confCities = Cities
                .find({country: country.iso2})
                .toArray()
                .then(cities =>
                    _.size(
                    _.filter(cities, city => {
                        const relevantInc = _.filter(city.closeIncidents,
                            inc => inRange(city, inc, range)
                                && inc.year <= to
                                && inc.year >= from)
                        const totalDead = _.sumBy(relevantInc, inc => inc.best_est)
                        const incSum = _.size(relevantInc);
                        return totalDead >= minCas || incSum >= minInc
                    }))
                )
            const allCities = Cities
                .find({country: country.iso2})
                .count()
            return Promise
                .all([confCities, allCities])
                .then(cities => (
                    _.assign(country, {
                    confCities: cities[0],
                    allCities: cities[1],
                    ratio: cities[0] / cities[1]
                })))
        }).toArray((err, countries) => {
            if (err) return res.status(500).send(err);
            Promise
                .all(countries)
                .then(ctrs => writeResponse(res, ctrs, req.query.format))

        })
    });

    router.get('/country/:ccode', (req, res) => {
        const { ccode } = req.params;
        const { minCas, minInc, from, to } = req.query;
        const range = parseInt(req.query.range) * 1000;
        Cities
            .find({country: ccode})
            .toArray()
            .then(cities => {
                const confCities = [];
                const safeCities = [];
                _.forEach(cities, city => {
                    const relevantInc = _.filter(city.closeIncidents,
                        inc => inRange(city, inc, range)
                            && inc.year <= to
                            && inc.year >= from)
                    const totalDead = _.sumBy(relevantInc, inc => inc.best_est)
                    const incSum = _.size(relevantInc);
                    if (totalDead >= minCas || incSum >= minInc)
                        confCities.push(_.assign(city, {closeIncidents:null}));
                    else
                        safeCities.push(_.assign(city, {closeIncidents:null}));
                });
                Countries.findOne({iso2: ccode}).then(ctry => {
                    const { country, Population } = ctry;
                    res.json({
                        name: country,
                        population: Population,
                        confCities,
                        safeCities
                    });
                })
            })
    });
    router.get('/refugees/:ccode', (req, res) => {
        const { ccode } = req.params;
        const path = `./precomputed/refugee_data/refugee_data_${ccode}.json`;
        res.sendFile(path, {root: __dirname});
    });

    return router;
};

module.exports = connector;
