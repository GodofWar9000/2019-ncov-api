const axios = require('axios');
const cheerio = require('cheerio');
const NodeGeocoder = require('node-geocoder');
const geocoder = NodeGeocoder({
	provider: 'openstreetmap'
});

const stringToNumber = str => +str.replace(/,/g, '');

class Scraper {
	constructor() {
		// this.confirmedCasesUrl = 'https://bnonews.com/index.php/2020/01/the-latest-coronavirus-cases/';
		this.timelineUrl = 'https://bnonews.com/index.php/2020/01/timeline-coronavirus-epidemic/';
		this.confirmedCasesUrl = 'https://www.worldometers.info/coronavirus/';
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

	async getConfirmedCases() {
		const res = await axios(this.confirmedCasesUrl);
		const $ = cheerio.load(res.data);
		const data = [];
		$('#table3 tbody tr').each((idx, el) => {
			const td = $(el).children('td');
			const obj = {
				country: td.eq(0).text().trim(),
				cases: +td.eq(1).text().trim().replace(/,/g, ''),
				deaths: +td.eq(2).text().trim().replace(/,/g, ''),
				region: td.eq(3).text().trim(),
			}
			data.push(obj);
		});
		
		return Promise.all(data.map((item) => {
			return this.geocode(item.country)
			.then(({ lat, lon }) => {
				return {
					...item,
					coordinates: { lat, lon }
				}
			})
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