const express = require('express');
const apicache = require('apicache');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const Scraper = require('./services/Scraper');
const Twitter = require('./services/Twitter');

const PORT = process.env.PORT;

const app = express();
const cache = apicache.middleware;
app.use(
	cors({
		origin: process.env.CORS_ORIGIN
	})
);
// create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(
	path.join(__dirname, 'access.log'),
	{ flags: 'a' }
);

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }));

app.get('/api/confirmed-cases', cache('10 minutes'), async (req, res) => {
	const scraper = new Scraper();
	const data = await scraper.getConfirmedCases();
	return res.json(data);
});

app.get('/api/mainland-china-daily-report', async (req, res) => {
	const scraper = new Scraper();
	const data = await scraper.getMainlandChinaDailyReport();
	return res.json(data);
});

app.get('/api/daily-deaths', async (req, res) => {
	const scraper = new Scraper();
	const data = await scraper.getDailyDeaths();
	return res.json(data);
});

app.get('/api/tweets', async (req, res) => {
	const twit = new Twitter();
	const data = await twit.getTweets(req.query);
	return res.json(data);
});

app.get('/api/timeline', async (req, res) => {
	const scraper = new Scraper();
	const data = await scraper.getTimeline();
	return res.json(data);
});

app.get('*', (req, res) => res.send('Page Not found'));

app.listen(PORT, () => {
	console.log(`App listening on port ${PORT}!`);
});
