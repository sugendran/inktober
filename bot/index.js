var twitter = require('./twitter');
var flickr = require('./flickr');
var twitterProcessor = require('./twitter-processor');
var flickrProcessor = require('./flickr-processor');
var starttime = Date.now();

exports.register = function (plugin, options, next) {
  setTimeout(function () {
    if (plugin.app.config.enableBots) {
      plugin.log(['log'], 'Starting bots');
      twitter.init(plugin);
      flickr.init(plugin);


      // will restart the bot every 8 hours as streams seem to die
      //  setInterval(function () {
      //    twitter.init(plugin);
      //  }, 4 * 60 * 60 * 1000);
    }
    if (plugin.app.config.enableProcessing) {
      plugin.log(['log'], 'Starting processors');
      twitterProcessor.init(plugin);
      flickrProcessor.init(plugin);
    }
  }, 1000);

  plugin.route({
    path: '/health',
    method: 'GET',
    handler: function (request, reply) {
      var obj = {
        uptime: (Date.now() - starttime),
        flickr: flickr.health(),
        twitter: twitter.health(),
        twitterProcessor: twitterProcessor.health(),
        flickrProcessor: flickrProcessor.health()
      };
      var status = obj.uptime > 360000 && obj.twitter == 0 ? 500 : 200;
      reply(obj).code(status);
    }
  });

  next();
};

exports.register.attributes = {
  name: 'bot',
  version: '0.0.1'
};
