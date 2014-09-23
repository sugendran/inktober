var request = require('request');
var _ = require('underscore');
var Post = require('../models/post');

function failTask (API_URL, task, done) {
  request({
    url: API_URL + '/task/' + task.id,
    method: 'POST',
    body: JSON.stringify({
      id: task.id,
      source: task.source,
      status: 'failed'
    }),
    headers: {
      "Content-type": "application/json"
    }
  }, done);
}

function completeTask (API_URL, task, done) {
  request({
    url: API_URL + '/task/' + task.id,
    method: 'POST',
    body: JSON.stringify({
      id: task.id,
      source: task.source,
      status: 'completed'
    }),
    headers: {
      "Content-type": "application/json"
    }
  }, done);
}

function savePost (API_URL, post, done) {
  request({
    url: API_URL + '/post',
    method: 'PUT',
    body: JSON.stringify(post.toJSON()),
    headers: {
      "Content-type": "application/json"
    }
  }, done);
}

function saveTask (API_URL, task, done) {
  done = done || function () { };
  request({
    url: API_URL + '/task',
    method: 'PUT',
    body: JSON.stringify(task.toJSON()),
    headers: {
      "Content-type": "application/json"
    }
  }, done);
}

function checkIfProcessed(API_URL, url, done) {
  request({
    url: API_URL + '/post?link=' + encodeURIComponent(url),
    method: 'GET',
    headers: {
      "Content-type": "application/json"
    }
  }, function (err, resp, body) {
    if (err) { return done(err); }
    var obj = JSON.parse(body);
    if (obj.length) { return done(new Error("URL was already processed")); }
    done();
  });
}

function extractPost (EMBEDLY_KEY, API_URL, url, done) {
  checkIfProcessed(API_URL, url, function (err) {
    if (err) { return done(err); }

    var embedlyUrl = "http://api.embed.ly/1/extract?key=" + EMBEDLY_KEY + "&url=" + encodeURIComponent(url) + "&format=json";
    request({
      url: embedlyUrl,
      method: 'GET'
    }, function (error, resp, body) {
      if (error) { return done(error); }
      var details = JSON.parse(body);
      var photo = _.findWhere(details.media, { type: 'photo' });
      if (!photo) { return done(); }
      var post = new Post(photo);
      post.published = details.published;
      post.title = details.title;
      post.author = details.provider_display;
      post.link = details.url;
      savePost(API_URL, post, done);
    });
  });
}

module.exports.failTask = failTask;
module.exports.completeTask = completeTask;
module.exports.extractPost = extractPost;
module.exports.saveTask = saveTask;