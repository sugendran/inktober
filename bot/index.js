var twitter = require('./twitter');
var flickr = require('./flickr');
var twitterProcessor = require('./twitter-processor');

exports.register = function (plugin, options, next) {
  if (plugin.app.config.enableBots) {
    plugin.log(['log'], 'Starting bots');
    twitter.init(plugin);
    flickr.init(plugin);
  }
  twitterProcessor.init(plugin);

  plugin.route({
    path: '/health',
    method: 'GET',
    handler: function (request, reply) {
      reply({
        flickr: flickr.health(),
        twitter: twitter.health(),
        twitterProcessor: twitterProcessor.health()
      });
    }
  });

  next();
};

exports.register.attributes = {
  name: 'bot',
  version: '0.0.1'
};