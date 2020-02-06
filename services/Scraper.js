const axios = require('axios');
const cheerio = require('cheerio');
const dotenv = require('dotenv');
const { GoogleSpreadsheet } = require('google-spreadsheet');
dotenv.config();

// Novel Coronavirus (2019-nCoV) Cases, provided by JHU CSSE
// Load google sheet
const sheetId = '1UF2pSkFTURko2OvfHWWlFpDFAr1UxCBA4JLwlSP6KFo';
const doc = new GoogleSpreadsheet(sheetId);
doc.useApiKey(process.env.GOOGLE_API_KEY);

class Scraper {
	async getHTML(url) {
		const res = await axios(url);
		return cheerio.load(res.data);
	}

	async getTimeline() {
		const $ = await this.getHTML(
			'https://bnonews.com/index.php/2020/01/timeline-coronavirus-epidemic/'
		);
		const timelineDiv = $('#mvp-content-main');

		const data = timelineDiv
			.find('h4')
			.toArray()
			.map((h4, h4Idx) => ({
				date: $(h4)
					.text()
					.trim(),
				time: timelineDiv
					.find('ul')
					.eq(h4Idx)
					.children('li')
					.toArray()
					.map(li => ({
						time_and_description: $(li)
							.text()
							.trim()
							.replace(' (Source)', ''),
						source: $(li)
							.find('a')
							.attr('href')
					}))
			}));
		const latest = await this.getTimelineLatest();
		return [...latest, ...data].map(item => {
			return {
				...item,
				time: item.time
					.filter(
						i => !i.time_and_description.includes('Total at the end of the day')
					)
					.map(i => ({
						time: i.time_and_description.slice(0, 5),
						description: i.time_and_description.replace(
							`${i.time_and_description.slice(0, 5)}: `,
							''
						),
						source: i.source
					}))
			};
		});
	}

	async getTimelineLatest() {
		const $ = await this.getHTML(
			'https://bnonews.com/index.php/2020/02/the-latest-coronavirus-cases/'
		);
		const data = [];
		$('h2:contains("Timeline (GMT)")')
			.nextUntil('h3')
			.each((idx, el) => {
				if (el.name === 'h4') {
					const obj = {
						date: $(el)
							.text()
							.trim(),
						time: $(el)
							.next()
							.children('li')
							.toArray()
							.map(li => ({
								time_and_description: $(li)
									.text()
									.trim()
									.replace(' (Source)', ''),
								source: $(li)
									.find('a')
									.attr('href')
							}))
					};

					data.push(obj);
				}
			});

		return data;
	}

	async fetchTimeSeries() {
		try {
			await doc.loadInfo();

			// Load headers
			const sheet = doc.sheetsByIndex[0];
			await sheet.loadHeaderRow();
			const headers = [...sheet.headerValues.slice(0, 5)];
			sheet.headerValues.slice(5).forEach(item => {
				const date = item.split(' ')[0];
				const idx = headers.map(i => i.split(' ')[0]).indexOf(date);
				if (idx === -1) {
					headers.push(item);
				} else {
					headers[idx] = item;
				}
			});

			const data = [];
			// Load confirmed sheets
			const confirmedSheet = doc.sheetsByIndex[0];
			const confirmedSheetRows = await confirmedSheet.getRows();

			// Load recovered sheet
			const recoveredSheet = doc.sheetsByIndex[1];
			const recoveredSheetRows = await recoveredSheet.getRows();

			// Load death sheet
			const deathSheet = doc.sheetsByIndex[2];
			const deathSheetRows = await deathSheet.getRows();

			confirmedSheetRows.forEach(row => {
				const obj = {};
				headers.slice(0, 5).forEach(header => {
					obj[header] = row[header];
				});
				obj.dates = [];
				headers.slice(5).forEach(header => {
					obj.dates.push({
						date: header.split(' ')[0],
						confirmed: +row[header] || 0,
						recovered:
							+recoveredSheetRows.find(
								i => i.Lat === row.Lat && i.Long === row.Long
							)[header] || 0,
						death:
							+deathSheetRows.find(
								i => i.Lat === row.Lat && i.Long === row.Long
							)[header] || 0
					});
				});

				data.push(obj);
			});

			return {
				total_confirmed: data.reduce(
					(a, b) => a + b.dates[b.dates.length - 1].confirmed,
					0
				),
				total_recovered: data.reduce(
					(a, b) => a + b.dates[b.dates.length - 1].recovered,
					0
				),
				total_death: data.reduce(
					(a, b) => a + b.dates[b.dates.length - 1].death,
					0
				),
				last_update: new Date(),
				data
			};
		} catch (e) {
			throw e;
		}
	}
}

module.exports = Scraper;
