var request = require('request');
var Task = require('../models/task');
var processed = [];
var taskUtils = require('./task-utils');

// only keep the values for the last hour
setInterval(function () {
  var now = Date.now() - 60 * 60 * 1000;
  processed = processed.filter(function (val) { return val >= now; });
}, 1000);

function GetNextItem (plugin, done) {
  var API_URL = 'http://127.0.0.1:' + plugin.app.config.ports.api;
  request({
    url: API_URL + '/task?source=twitter&limit=1&pending=true',
    method: 'GET',
    headers: {
      "Content-type": "application/json"
    }
  }, function (error, response, body) {
    if (error) {
      console.error(error);
      return;
    }
    var obj = JSON.parse(body);
    if (obj.length === 0) {
      // wait some time before trying for a task since there weren't any
      setTimeout(done, 5000);
    } else {
      var task = new Task(obj[0]);
      processed.push(new Date());
      // only care about things with links
      var url = null;
      if (task.payload.entities.urls && task.payload.entities.urls.length > 0) {
        url = task.payload.entities.urls[0];
      } else if (task.payload.entities.media && task.payload.entities.media.length > 0) {
        url = task.payload.entities.media[0];
      }
      if (url == null) {
        return taskUtils.failTask(API_URL, task, done);
      }

      var created = Date.parse(task.payload.created_at);
      if (isNaN(created)) {
        console.log('failed to parse '+ task.payload.created_at);
        created = Date.now();
      }
      taskUtils.extractPost(
        plugin.app.config.embedly,
        API_URL,
        url.expanded_url || url.url,
        created,
        function (error) {
          if (error) {
            return taskUtils.failTask(API_URL, task, done);
          }
          taskUtils.completeTask(API_URL, task, done);
        });
    }
  });
}

module.exports.init = function (plugin) {
  var next = GetNextItem.bind(null, plugin, function (error) {
    if (error) { plugin.log(['error', error.message]); }
    setTimeout(next, 50);
  });
  setTimeout(next, 1000);
};

module.exports.health = function () {
  return processed.length;
};
