const express = require('express');
const apicache = require('apicache');
const cors = require('cors');
const Scraper = require('./Scraper');

const PORT = process.env.PORT || 3000;

const app = express();
const cache = apicache.middleware;
app.use(cache('10 minutes'));
app.use(cors({
	origin: process.env.ORIGIN || 'http://localhost:8080'
}));

app.get('/api/confirmed-cases', async (req, res) => {
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

app.get('/api/timeline', async (req, res) => {
	const scraper = new Scraper();
	const data = await scraper.getTimeline();
	return res.json(data);
});

app.listen(PORT, () => {
	console.log(`App listening on port ${PORT}!`);
});