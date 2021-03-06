var request = require('request');
var _ = require('underscore');

exports.register = function (plugin, options, next) {

  plugin.route({
    path: '/health',
    method: 'GET',
    handler: function (req, reply) {
      var result = { web: "healhty" };
      var code = 200;
      request.get(
        'http://127.0.0.1:' + plugin.app.config.ports.api + '/health',
        function (err, resp, body) {
          if (err) {
            code = 500;
            result.api = err.message;
          } else {
            if (resp.statusCode != 200) {
              code = resp.statusCode;
            }
            _.extend(result, JSON.parse(body));
          }
          request.get(
            'http://127.0.0.1:' + plugin.app.config.ports.bot + '/health',
            function (err, resp, body) {
              if (err) {
                code = 500;
                result.bot = err.message;
              } else {
                if (resp.statusCode != 200) {
                  code = resp.statusCode;
                }
                _.extend(result, JSON.parse(body));
              }
              reply(result).code(code);
            });
        });
    }
  });

  plugin.route({
    method: 'GET',
    path: '/post',
    handler: {
      proxy: {
        host: '127.0.0.1',
        port: plugin.app.config.ports.api,
        protocol: 'http',
        passThrough: true
      }
    }
  });

  plugin.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: __dirname + '/public',
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
