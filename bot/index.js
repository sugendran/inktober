var twitter = require('./twitter');

exports.register = function (plugin, options, next) {
  twitter.init(plugin);

  plugin.route({
    path: '/health',
    method: 'GET',
    handler: function (request, reply) {
      reply({
        twitter: twitter.health()
      });
    }
  });

  next();
};

exports.register.attributes = {
  name: 'bot',
  version: '0.0.1'
};