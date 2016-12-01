const express = require('express');
const Promise = require('Bluebird');
const _ = require('lodash')
const geolib = require('geolib');

const connector = (db) => {
    const router = express.Router();

    const Cities = db.collection('cities');
    const Countries = db.collection('countries');

    router.get('/world', (req, res) => {

        const from = parseInt(req.query.from);
        const to = parseInt(req.query.to);
        const minCas = parseInt(req.query.minCas);
        const minInc = parseInt(req.query.minInc);
        const range = parseInt(req.query.range) / 6371;
        Countries.find().map((country) => {
            const confCities = Cities
                .aggregate([
                    { $match: {"country": country.iso2}},
                    { $unwind: "$closeIncidents" },

                    { $match: { $and: [
                        { "closeIncidents.year": {
                            $gt: from,
                            $lt: to
                        } },
                    ]
                    }},
                    { $group: {
                        _id: {
                            geoname: "$geonameid",
                            name: "$name",
                            latitude: "$latitude",
                            longitude: "$longitude"
                        },
                        incidents: {$sum: 1},
                        totalDead: {$sum: "$closeIncidents.best_est"}
                    }},
                    { $match: { $or: [
                        { "incidents": { $gt: minInc} },
                        { "totalDead": { $gt: minCas} }
                    ]}}
                ]).toArray()

            const allCities = Cities
                .find({country: country.iso2})
                .count()
            return Promise
                .all([confCities, allCities])
                .then(cities => ({
                    country,
                    confCities: cities[0],
                    allCities: cities[1],
                }))
        }).toArray((err, countries) => {
            if (err) return res.status(500).send(err);
            Promise
                .all(countries)
                .tap(ctrs => console.log(ctrs[0]))
                .then(ctrs => res.json(ctrs))

        })
    });

    router.get('/country', (req, res) => {

    });

    router.get('/city', (req, res) => {

    })

    return router;
};

module.exports = connector;
