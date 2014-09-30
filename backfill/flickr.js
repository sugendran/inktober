var config = require('../config');
var request = require('request');
var Task = require('../models/task');

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

function parseResponse (taskUrl, url, error, response, body) {
    if (error) {
      console.log(error.message);
      return;
    }
    var obj = JSON.parse(body);
    var totalPages = obj.photos.pages;
    var page = obj.photos.page;
    if (page < totalPages) {
      page++;
      var nextPage = url + '&page=' + page;
      console.log('requesting page ' + nextPage + ' of ' + totalPages);
      var callback = parseResponse.bind(this, taskUrl, url);
      request(nextPage, callback);
    }
    obj.photos.photo.forEach(pushTask.bind(null, taskUrl));
}


var taskUrl = 'http://127.0.0.1:' + config.ports.api + '/task';
var url = "https://api.flickr.com/services/rest/" +
          "?method=flickr.photos.search" +
          "&api_key=" + config.flickr +
          "&tags=inktober" +
          "&format=json&nojsoncallback=1";
var callback = parseResponse.bind(this, taskUrl, url);
request(url, callback);

