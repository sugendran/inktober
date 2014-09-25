var Post = require('../../models/post');
function startDateFromYear(year) {
  return Date.UTC(year, 8, 1);
}
function endDateFromYear(year) {
  return Date.UTC(year, 10, 30);
}
var thisYear = (new Date()).getFullYear();

module.exports = function (tableSvc, azure, TABLE_NAME) {
  var entityGenerator = azure.TableUtilities.entityGenerator;
  return {
    list: function (request, reply) {
      var ttl = 1;
      var year = request.query.year ? parseInt(request.query.year, 10) : thisYear;
      if (isNaN(year)) { year = thisYear; }
      var start = startDateFromYear(year);
      var end = endDateFromYear(year);

      var query = new azure.TableQuery().where('PartitionKey eq ?', 'post');
      if (request.query.limit) {
        query.top(request.query.limit);
      }
      // you can either search for a link or just page by date
      if (request.query.link) {
        query.and('link eq ?', request.query.link);
      } else if(request.query.url) {
        query.and('url eq ?', request.query.url);
      } else {
        // cache these results for an hour
        ttl = 60 * 60 * 1000;
        query.and('published le ' + end + 'l').and('published ge ' + start + 'l');
      }

      var continuationToken = null;
      var results = [];
      function get() {
        tableSvc.queryEntities(TABLE_NAME, query, continuationToken, function(error, result) {
          if (error) {
            return reply(error);
          }

          result.entries.map(function (entity) {
            var post = Post.fromEntity(entity);
            results.push(post.toJSON());
          });

          if (result.continuationToken) {
            continuationToken = result.continuationToken();
            get();
          } else {
            reply(results).ttl(ttl);
          }
        });
      }
      get();
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