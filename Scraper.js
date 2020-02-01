const axios = require('axios');
const cheerio = require('cheerio');
const NodeGeocoder = require('node-geocoder');
const geocoder = NodeGeocoder({
	provider: 'openstreetmap'
});

class Scraper {
	constructor() {
		this.confirmedCasesUrl = 'https://bnonews.com/index.php/2020/01/the-latest-coronavirus-cases/';
		this.timelineUrl = 'https://bnonews.com/index.php/2020/01/timeline-coronavirus-epidemic/';
	}
	
	async getConfirmedCases() {
		const res = await axios(this.confirmedCasesUrl);
		const $ = cheerio.load(res.data);
		const data = [];
		
		// Mainland China
		const mainlandChinaTbl = $('.wp-block-table').first().find('tbody > tr');
		mainlandChinaTbl.each((idx, item) => {
			if (idx === 0 || idx+1 === mainlandChinaTbl.length) return;
			
			const td = $(item).children('td');
			data.push({
				country_or_region: td.eq(0).text().trim().replace(' (including Wuhan)', '').replace(' Region', ''),
				cases: td.eq(1).text().trim(),
				deaths: td.eq(2).text().trim(),
				notes: td.eq(3).text().trim(),
				source: td.eq(4).find('a').attr('href')
			});
		});
		
		// Regions
		const regionsTbl = $('.wp-block-table').eq(1).find('tbody > tr');
		regionsTbl.each((idx, item) => {
			if (idx === 0 || idx+1 === regionsTbl.length) return;
			
			const td = $(item).children('td');
			data.push({
				country_or_region: td.eq(0).text().trim(),
				cases: td.eq(1).text().trim(),
				deaths: td.eq(2).text().trim(),
				notes: td.eq(3).text().trim(),
				source: td.eq(4).find('a').attr('href')
			});
		});
		
		// International
		const internationalTbl = $('.wp-block-table').eq(2).find('tbody > tr');
		internationalTbl.each((idx, item) => {
			if (idx === 0 || idx+1 === internationalTbl.length) return;
			
			const td = $(item).children('td');
			data.push({
				country_or_region: td.eq(0).text().trim(),
				cases: td.eq(1).text().trim(),
				deaths: td.eq(2).text().trim(),
				notes: td.eq(3).text().trim(),
				source: td.eq(4).find('a').attr('href')
			});
		});
		
		return Promise.all(data.map((item) => {
			return this.geocode(item.country_or_region)
			.then(({ lat, lon }) => {
				return {
					...item,
					coordinates: { lat, lon }
				}
			})
		}));
	}
	
	async getTimeline() {
		const res = await axios(this.timelineUrl);
		const $ = cheerio.load(res.data);
		const timelineDiv = $('#mvp-content-main');
		
		return timelineDiv
		.find('h4')
		.toArray()
		.map((h4, h4Idx) => ({
			date: $(h4).text().trim(),
			time: timelineDiv
			.find('ul')
			.eq(h4Idx)
			.children('li')
			.toArray()
			.map((li) => ({
				time_and_description: $(li).text().trim().replace(' (Source)', ''),
				source: $(li).find('a').attr('href')
			}))
		}));
	}
	
	async geocode(address) {
		const results = await geocoder.geocode(address);
		return {
			lat: results[0].latitude,
			lon: results[0].longitude,
		};
	}
}

module.exports = Scraper;