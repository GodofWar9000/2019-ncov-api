# 2019-nCoV API

> Coronavirus (COVID-19) API

Frontend can be found here [2019-ncov-frontend](https://github.com/sorxrob/2019-ncov-frontend).

## Data

[CSSEGISandData/COVID-19](https://github.com/CSSEGISandData/COVID-19) already stopped supplementing recovered data COVID-19. I moved to [this repo](https://github.com/bumbeishvili/covid19-daily-data) which scrapes worldometer page.

## Build Setup

```bash
# set consumer keys and port
$ cp .env.example .env

# install dependencies
$ npm install

# serve at localhost:3000
$ npm start

# start cron
$ node runner
```

## License & copyright

© Robert C Soriano

Licensed under the [MIT License](LICENSE).
