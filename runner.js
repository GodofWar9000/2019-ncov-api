const cron = require('node-cron');
const Scraper = require('./services/Scraper');
const fs = require('fs');

async function run() {
	try {
		const scraper = new Scraper();
		const data = await scraper.fetchTimeSeries();
		fs.writeFile('./data.json', JSON.stringify(data), 'utf-8', function() {
			console.log('Download success');
		});
	} catch (e) {
		console.log(e);
	}
}

// Run every 30 minutes
cron.schedule('*/30 * * * *', () => {
	run();
});
