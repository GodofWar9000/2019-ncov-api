const express = require('express');
require('dotenv').config();
const cors = require('cors');
const morgan = require('morgan');
const apicache = require('apicache');
const compression = require('compression');

const cache = apicache.middleware;

const routes = require('./routes');

const PORT = process.env.PORT || 3030;

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);
app.use(compression());
app.use(cache('1 hour'));

// setup the logger
app.use(morgan('combined'));

app.use('/api', routes);

app.get('*', (_, res) => res.send('Page Not found'));

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
