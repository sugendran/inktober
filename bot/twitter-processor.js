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
    if (obj.length) {
      var task = new Task(obj[0]);
      // only care about things with links
      if (task.payload.entities.urls.length < 1) {
        return taskUtils.failTask(API_URL, task, done);
      }
      var url = task.payload.entities.urls[0];
      taskUtils.extractPost(plugin.app.config.embedly, API_URL, url.expanded_url || url.url, function (error) {
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
    if (error) { console.log('error' + error.message); }
    setTimeout(next, 50);
  });
  setTimeout(next, 10000);
};

module.exports.health = function () {
  return processed.length + ' retweets per hour';
};