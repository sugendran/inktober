exports.register = function (plugin, options, next) {

  plugin.route({
    path: '/health',
    method: 'GET',
    handler: function (request, reply) {
      reply({ web: "healhty" });
    }
  });

  plugin.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: 'public',
        listing: false
      }
    }
  });

  next();
};

exports.register.attributes = {
  name: 'web',
  version: '0.0.1'
};