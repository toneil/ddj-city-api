const express = require('express');
const cors = require('cors')
const routes = require('./routes');
const app = express();

app.use(cors());

app.use(routes);
app.listen(2330, (err) => {
    console.log("API listening on port 2330");
});
