const fastify = require('fastify')({ logger: true });
const fastifyCors = require('fastify-cors');
const Scraper = require('./Scraper');

const PORT = process.env.PORT || 3000;

fastify.register(fastifyCors, { 
	origin: process.env.ORIGIN || 'http://localhost:8080'
});

fastify.get('/api/confirmed-cases', async (request) => {
	const scraper = new Scraper();
	const data = await scraper.getConfirmedCases();
	return data;
});

fastify.get('/api/timeline', async (request) => {
	const scraper = new Scraper();
	const data = await scraper.getTimeline();
	return data;
});

const start = async () => {
	try {
		await fastify.listen(PORT);
		fastify.log.info(`server listening on ${fastify.server.address().port}`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}

start();