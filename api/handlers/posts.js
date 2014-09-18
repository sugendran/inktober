var Post = require('../../models/post');


module.exports = function (tableSvc) {
  return {
    list: function (request, reply) {
      reply(new Error("Not implemented yet LIST")).takeover();
    },
    create: function (request, reply) {
      var post = new Post(request.payload);
      reply(new Error("Not implemented yet CREATE")).takeover();
    },
    get: function (request, reply) {
      var id = request.params.id;
      reply(new Error("Not implemented yet GET:" + id)).takeover();
    },
    update: function (request, reply) {
      var id = request.params.id;
      reply(new Error("Not implemented yet UPDATE:" + id)).takeover();
    }
  };
};