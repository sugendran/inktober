var azure = require('azure-storage');
var retryOperations = new azure.ExponentialRetryPolicyFilter();
var tableSvc = azure.createTableService().withFilter(retryOperations);
var TASK_TABLE_NAME = 'tasks';
var POST_TABLE_NAME = 'posts';
var postHandlers = require('./handlers/posts')(tableSvc, azure, POST_TABLE_NAME);
var taskHandlers = require('./handlers/tasks')(tableSvc, azure, TASK_TABLE_NAME);

exports.register = function (plugin, options, next) {

  // routes are:
  // for posts
  // GET /post/:id <-- return item
  // GET /post?before=x <-- 20 items before x
  // PUT /post <-- add new item
  // POST /post/:id <-- mark as spam/broken
  // for tasks
  // GET /task?status=pending <-- next available task
  // GET /task/:id <-- return item
  // PUT /task <-- add new item
  // POST /task/:id <-- mark as completed

  plugin.route({
    method: 'GET',
    path: '/post',
    handler: postHandlers.list
  });
  plugin.route({
    method: 'PUT',
    path: '/post',
    handler: postHandlers.create
  });
  plugin.route({
    method: 'GET',
    path: '/post/{id}',
    handler: postHandlers.get
  });
  plugin.route({
    method: 'POST',
    path: '/post/{id}',
    handler: postHandlers.update
  });
  plugin.route({
    method: 'GET',
    path: '/task',
    handler: taskHandlers.list
  });
  plugin.route({
    method: 'PUT',
    path: '/task',
    handler: taskHandlers.create
  });
  plugin.route({
    method: 'GET',
    path: '/task/{source}/{id}',
    handler: taskHandlers.get
  });
  plugin.route({
    method: 'POST',
    path: '/task/{id}',
    handler: taskHandlers.update
  });


  plugin.route({
    path: '/health',
    method: 'GET',
    handler: function (request, reply) {
      reply({ api: 'healthy' });
    }
  });

  tableSvc.createTableIfNotExists(TASK_TABLE_NAME, function(error){
    if (error) {
      console.error(error.message);
      return next(error);
    }
    tableSvc.createTableIfNotExists(POST_TABLE_NAME, function(error){
      if (error) {
        console.error(error.message);
        return next(error);
      }
      next();
    });
  });
};

exports.register.attributes = {
  name: 'api',
  version: '0.0.1'
};