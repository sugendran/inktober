var Hapi = require('hapi');
var config = require('./config');


var manifest = {
  pack: {
    app: {
      config: config
    }
  },
  servers: [{
    host: '127.0.0.1',
    port: config.ports.bot,
    options: {
      labels: 'bot'
    }
  }, {
    host: '127.0.0.1',
    port: config.ports.api,
    options: {
      labels: 'api'
    }
  }, {
    port: config.ports.web,
    options: {
      labels: 'web',
      state: {
        cookies: {
          clearInvalid: true
        }
      }
    }
  }],
  plugins: {
    './bot': [{
      select: 'bot'
    }],
    './api': [{
      select: 'api'
    }],
    './web': [{
      select: 'web'
    }],
    'good': {
      alwaysMeasureOps: false,
      subscribers: {
        console: ['request', 'log', 'error']
      }
    }
  }
};


Hapi.Pack.compose(manifest, { relativeTo: __dirname }, function(err, pack) {
  if (err) {
    throw err;
  }
  pack.log("log", "Starting");
  pack.start();
});