const express = require('express');
const router = express.Router();
const apicache = require('apicache');
const Scraper = require('./services/Scraper');
const Twitter = require('./services/Twitter');

const scraper = new Scraper();
const cache = apicache.middleware;

app.use(cache('5 minutes'));

router.get('/cases', async (req, res) => {
  const data = await scraper.fetchTimeSeries();
  return res.json(data);
});

router.get('/tweets', async (req, res) => {
  const twit = new Twitter();
  const data = await twit.getTweets(req.query);
  return res.json(data);
});

router.get('/timeline', async (req, res) => {
  const data = await scraper.getTimeline();
  return res.json(data);
});

router.get('/fatality-rate', async (req, res) => {
  const data = await scraper.getFatalityRate();
  return res.json(data);
});

module.exports = router;
