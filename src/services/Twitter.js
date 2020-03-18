const Twit = require('twit');
const T = new Twit({
	consumer_key: process.env.CONSUMER_KEY,
	consumer_secret: process.env.CONSUMER_SECRET,
	access_token: process.env.ACCESS_TOKEN,
	access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

class Twitter {
	
	getTweets(opts) {
		return new Promise((resolve, reject) => {
			T.get('search/tweets', opts, function(err, data) {
				if (err) {
					return reject(err);
				}
				
				resolve(data);
			});
		});
	}
	
}

module.exports = Twitter;