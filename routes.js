const express = require('express');
const router = express.Router();
const Scraper = require('./services/Scraper');
const Twitter = require('./services/Twitter');

const scraper = new Scraper();

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
