var Task = require('../../models/task');
var TABLE_NAME = 'devtasks';
module.exports = function (tableSvc, azure) {
  var entityGenerator = azure.TableUtilities.entityGenerator;
  return {
    list: function (request, reply) {
      var limit = request.query.limit || 1;
      var query = new azure.TableQuery().top(limit);
      if (request.query.source) {
        query.where('PartitionKey eq ?', request.query.source);
        if (request.query.pending) {
          query.and('status eq ?', 'pending');
        }
      } else if (request.query.pending) {
        query.where('status eq ?', 'pending');
      }
      tableSvc.queryEntities(TABLE_NAME, query, null, function(error, result) {
        if (error) {
          return reply(error);
        }
        var tasks = result.entries.map(function (entity) {
          var task = Task.fromEntity(entity);
          return task.toJSON();
        });
        reply(tasks);
      });
    },
    create: function (request, reply) {
      var task = new Task(request.payload);
      tableSvc.insertEntity(
        TABLE_NAME,
        task.toEntity(entityGenerator),
        function (error, result) {
          if (error) {
            return reply(error);
          }
          reply(task.toJSON()).code(201).etag(result['.metadata'].etag);
      });
    },
    get: function (request, reply) {
      var id = request.params.id;
      var source = request.params.source;
      tableSvc.retrieveEntity(
        TABLE_NAME,
        source,
        id,
        function (error, result) {
          if (error) {
            return reply(error);
          }
          var task = Task.fromEntity(result);
          reply(task.toJSON());
      });
    },
    update: function (request, reply) {
      var id = request.params.id;
      var source = request.params.source;
      var status = request.params.status;
      if (status !== 'completed' && status !== 'failed') {
        return reply(new Error('Invalid status'));
      }
      tableSvc.retrieveEntity(
        TABLE_NAME,
        source,
        id,
        function (error, result) {
          if (error) {
            return reply(error);
          }
          result.status._ = status;
          tableSvc.updateEntity(TABLE_NAME, result, function (error) {
            if (error) {
              return reply(error);
            }
            var task = Task.fromEntity(result);
            reply(task.toJSON());
          });
      });
    }
  };
};