var request = require('request');
var Task = require('../models/task');
var processed = [];
var taskUtils = require('./task-utils');
var Post = require('../models/post');
var _ = require('underscore');

// only keep the values for the last hour
setInterval(function () {
  var now = Date.now() - 60 * 60 * 1000;
  processed = processed.filter(function (val) { return val >= now; });
}, 1000);

function GetNextItem (plugin, done) {
  var API_URL = 'http://127.0.0.1:' + plugin.app.config.ports.api;
  request({
    url: API_URL + '/task?source=flickr&limit=1&pending=true',
    method: 'GET',
    headers: {
      "Content-type": "application/json"
    }
  }, function (error, response, body) {
    if (error) {
      console.error(error);
      return;
    }
    processed.push(new Date());
    var obj = JSON.parse(body);
    if (obj.length === 0) {
      // wait some time before trying for a task since there weren't any
      setTimeout(done, 5000);
    } else {
      var task = new Task(obj[0]);
      request({
        url: 'https://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key=' + plugin.app.config.flickr + '&photo_id=' + task.payload.id + '&format=json&nojsoncallback=1',
        method: 'GET'
      }, function (err, resp, body) {
        if (err) {
          plugin.log(['error'], err.message);
          return taskUtils.failTask(API_URL, task, done);
        }
        var details = JSON.parse(body);
        var link = _.findWhere(details.photo.urls.url, {type: 'photopage'})._content;
        var created = parseInt(details.photo.dateuploaded, 10) * 1000;
        request({
          url: 'https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=' + plugin.app.config.flickr + '&photo_id=' + task.payload.id + '&format=json&nojsoncallback=1',
          method: 'GET'
        }, function (err, resp, body) {
          if (err) {
            plugin.log(['error'], err.message);
            return taskUtils.failTask(API_URL, task, done);
          }
          var sizeInfo = JSON.parse(body);
          var sized = _.findWhere(sizeInfo.sizes.size, { label: 'Medium' });
          if (!sized) {
            sized = _.findWhere(sizeInfo.sizes.size, { label: 'Original' });
          }
          var post = new Post({
            link: link,
            url: sized.source,
            width: sized.width,
            height: sized.height,
            published: created,
            title: details.photo.title._content,
            author: details.photo.owner.username,
            status: "active"
          });
          taskUtils.checkAndSavePost(API_URL, post, function (err) {
            if (err) {
              return taskUtils.failTask(API_URL, task, done);
            }
            return taskUtils.completeTask(API_URL, task, done);
          });
        });
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
  return processed.length + ' flickrs per hour';
};