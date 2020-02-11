const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const request = require('request');
const csv = require('csvtojson');

class Scraper {
  constructor() {
    this.timeSeriesURL =
      'https://raw.githubusercontent.com/CSSEGISandData/2019-nCoV/master/time_series';
  }

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
    const formatDate = date => moment(new Date(date)).format('M/D/YYYY');
    const roundOffCoord = coord => parseFloat(coord.trim()).toFixed(5);

    const data = [];

    // Load confirmed cases
    const confirmedRows = await this.getConfirmedCases();
    const confirmedHeaders = Object.keys(confirmedRows[0]);
    const headers = [...confirmedHeaders.slice(0, 4)];
    confirmedHeaders.slice(4).forEach(item => {
      const idx = headers.map(i => formatDate(i)).indexOf(formatDate(item));
      if (idx === -1) {
        headers.push(formatDate(item));
      } else {
        headers[idx] = formatDate(item);
      }
    });

    // Load recovered sheet
    const recoveredRows = await this.getRecovered();

    // Load recovered sheet
    const deathRows = await this.getDeaths();

    confirmedRows.forEach(row => {
      const obj = {};
      headers.slice(0, 4).forEach(header => {
        obj[header] = row[header];
      });
      obj.dates = [];
      headers.slice(4).forEach(header => {
        const confirmedHeaders = Object.keys(confirmedRows[0]).filter(
          i => formatDate(i) === header
        );
        const recoveredHeaders = Object.keys(recoveredRows[0]).filter(
          i => formatDate(i) === header
        );
        const deathHeaders = Object.keys(deathRows[0]).filter(
          i => formatDate(i) === header
        );
        obj.dates.push({
          date: header.split(' ')[0],
          confirmed: +row[confirmedHeaders[confirmedHeaders.length - 1]] || 0,
          recovered:
            +recoveredRows.find(
              i =>
                roundOffCoord(i.Lat) === roundOffCoord(row.Lat) &&
                roundOffCoord(i.Long) === roundOffCoord(row.Long)
            )[recoveredHeaders[recoveredHeaders.length - 1]] || 0,
          death:
            +deathRows.find(
              i =>
                roundOffCoord(i.Lat) === roundOffCoord(row.Lat) &&
                roundOffCoord(i.Long) === roundOffCoord(row.Long)
            )[deathHeaders[deathHeaders.length - 1]] || 0
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
      data
    };
  }

  parseCSV(url) {
    return new Promise((resolve, reject) => {
      const rows = [];
      csv()
        .fromStream(request.get(url))
        .subscribe(
          json => {
            rows.push(json);
          },
          () => {
            reject();
          },
          () => {
            resolve(rows);
          }
        );
    });
  }

  getConfirmedCases() {
    return this.parseCSV(
      `${this.timeSeriesURL}/time_series_2019-ncov-Confirmed.csv`
    );
  }

  getRecovered() {
    return this.parseCSV(
      `${this.timeSeriesURL}/time_series_2019-ncov-Recovered.csv`
    );
  }

  getDeaths() {
    return this.parseCSV(
      `${this.timeSeriesURL}/time_series_2019-ncov-Deaths.csv`
    );
  }
}

module.exports = Scraper;
