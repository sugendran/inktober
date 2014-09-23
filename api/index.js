var azure = require('azure-storage');
var retryOperations = new azure.ExponentialRetryPolicyFilter();
var tableSvc = azure.createTableService().withFilter(retryOperations);
var postHandlers = require('./handlers/posts')(tableSvc, azure);
var taskHandlers = require('./handlers/tasks')(tableSvc, azure);

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

  tableSvc.createTableIfNotExists('devtasks', function(error){
    if (error) {
      return next(error);
    }
    tableSvc.createTableIfNotExists('posts', function(error){
      if (error) {
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