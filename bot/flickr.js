// search: https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=dd7bea7f59366852cf2c9ca7bb97213f&tags=inktober&min_upload_date=2013-09-01&format=json&nojsoncallback=1
// getInfo:  https://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key=dd7bea7f59366852cf2c9ca7bb97213f&photo_id=14054953525&format=rest
// getSizes: https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=dd7bea7f59366852cf2c9ca7bb97213f&photo_id=14054953525&format=rest
var request = require('request');
var Task = require('../models/task');
var foundItems = [];
// only keep the values for the 24 hour
setInterval(function () {
  var now = Date.now() - 24 * 60 * 60 * 100;
  foundItems = foundItems.filter(function (val) { return val >= now; });
}, 1000);

function lz(val) {
  if (val < 10) {
    return '0' + val;
  }
  return val;
}

function pushTask (taskUrl, photo) {
  var task = new Task({
    source: "flickr",
    payload: photo
  });

  request({
    url: taskUrl,
    method: 'PUT',
    body: JSON.stringify(task.toJSON()),
    headers: {
      "Content-type": "application/json"
    }
  });
}

function parseResponse (taskUrl, url, log, error, response, body) {
    if (error) {
      log(['error'], error.message);
      return;
    }
    var obj = JSON.parse(body);
    var totalPages = obj.photos.pages;
    var page = obj.photos.page;
    if (page < totalPages) {
      page++;
      var nextPage = url + '&page=' + page;
      var callback = parseResponse.bind(this, taskUrl, url, log);
      request(nextPage, callback);
    }
    obj.photos.photo.forEach(pushTask.bind(null, taskUrl));
}

function checkLastPeriod (taskUrl, baseUrl, log) {

  // search the last day to make sure we've got everything
  var since = Date.now() - 24 * 60 * 60 * 1000;
  var start = new Date(since);
  var datestr = [start.getFullYear(), lz(start.getMonth() + 1), lz(start.getDate()) ].join('-');

  var url = baseUrl + "&min_upload_date=" + datestr;
  var callback = parseResponse.bind(this, taskUrl, url, log);
  request(url, callback);
}

module.exports.init = function (plugin) {
  var taskUrl = 'http://127.0.0.1:' + plugin.app.config.ports.api + '/task';
  var log = plugin.log.bind(plugin);
  var url = "https://api.flickr.com/services/rest/" +
            "?method=flickr.photos.search" +
            "&api_key=" + plugin.app.config.flickr +
            "&tags=inktober" +
            "&format=json&nojsoncallback=1";
  var check = checkLastPeriod.bind(this, taskUrl, url, log);
  check();
  setInterval(check, 12 * 60 * 60 * 1000);
};

module.exports.health = function () {
  return foundItems.length + ' in the last 24 hours';
};