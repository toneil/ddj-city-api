const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const routes = require('./routes');
const app = express();

const mongoUrl = 'mongodb://localhost:27017/ddj';

MongoClient.connect(mongoUrl, (err, db) => {
    if (err) console.log("DB error", db);
    app.use(routes(db));
    app.listen(2330, (err) => {
        console.log("API listening on port 2330");
    })
})
