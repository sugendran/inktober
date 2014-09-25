var requiredKeys = ['AZURE_STORAGE_ACCOUNT', 'AZURE_STORAGE_ACCESS_KEY'];
requiredKeys.forEach(function (key) {
  if (!process.env[key]) {
    throw new Error("Could not find an environment variable for " + key);
  }
});

var enableBots = true;
var enableProcessing = true;
if (process.env.ENABLE_BOTS) {
  enableBots = process.env.ENABLE_BOTS !== 'false';
}
if (process.env.ENABLE_PROCESSING) {
  enableProcessing = process.env.ENABLE_PROCESSING !== 'false';
}
var port = process.env.PORT || 8000;
if (typeof(port) === 'string') {
  port = parseInt(port, 10);
}

module.exports = {
  enableBots: enableBots,
  enableProcessing: enableProcessing,
  ports: {
    web: port,
    api: 8001,
    bot: 8002
  },
  twitter: {
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  },
  flickr: process.env.FLICKR_KEY,
  embedly: process.env.EMBEDLY_KEY
};