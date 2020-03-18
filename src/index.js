const express = require('express');
require('dotenv').config();
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');

const routes = require('./routes');

const PORT = process.env.PORT;

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN
  })
);
app.use(compression());

// setup the logger
app.use(morgan('combined'));

app.use('/api', routes);

app.get('*', (_, res) => res.send('Page Not found'));

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
