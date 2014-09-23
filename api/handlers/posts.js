var Post = require('../../models/post');
var TABLE_NAME = 'devposts';

module.exports = function (tableSvc, azure) {
  var entityGenerator = azure.TableUtilities.entityGenerator;
  return {
    list: function (request, reply) {
      // defaults to requesting the last 7 days
      var end = request.query.max_date ? parseInt(request.query.max_date, 10) : Date.now();
      if (isNaN(end)) { end = Date.now(); }
      var start = end - (7 * 24 * 60 * 60 * 1000);

      var query = new azure.TableQuery();
      if (request.query.limit) {
        query.top(request.query.limit);
      }
      // you can either search for a link or just page by date
      if (request.query.link) {
        query.where('link eq ?', request.query.link);
      } else {
        query.where('published gte ? AND published lte ?', start, end);
      }
      tableSvc.queryEntities(TABLE_NAME, query, null, function(error, result) {
        if (error) {
          return reply(error);
        }
        var posts = result.entries.map(function (entity) {
          var post = Post.fromEntity(entity);
          return post.toJSON();
        });
        reply(posts);
      });
    },
    create: function (request, reply) {
      var post = new Post(request.payload);
      tableSvc.insertEntity(
        TABLE_NAME,
        post.toEntity(entityGenerator),
        function (error, result) {
          if (error) {
            return reply(error);
          }
          reply(post.toJSON()).code(201).etag(result['.metadata'].etag);
      });
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