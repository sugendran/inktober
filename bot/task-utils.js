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

function checkIfExists(API_URL, url, done) {
  request({
    url: API_URL + '/post?url=' + encodeURIComponent(url),
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

function extractPost (EMBEDLY_KEY, API_URL, url, createdDate, done) {
  checkIfProcessed(API_URL, url, function (err) {
    if (err) { return done(err); }
    var embedlyUrl = "http://api.embed.ly/1/extract?key=" + EMBEDLY_KEY + "&url=" + encodeURIComponent(url) + "&format=json";
    request({
      url: embedlyUrl,
      method: 'GET'
    }, function (error, resp, body) {
      if (error) { return done(error); }
      var details = JSON.parse(body);
      var photo = _.isArray(details.media) ? _.findWhere(details.media, { type: 'photo' }) : details.media;
      if (!photo) { return done(); }
      if (!photo.url) { return done(); }
      var post = new Post(photo);
      if (details.published) {
        post.published = details.published;
      } else {
        post.published = createdDate;
      }
      post.title = details.title;
      post.author = details.provider_display;
      post.link = details.url;
      checkIfExists(API_URL, post.url, function (err) {
        if (err) { return done(err); }
        savePost(API_URL, post, done);
      });
    });
  });
}

function checkAndSavePost (API_URL, post, done) {
  checkIfExists(API_URL, post.url, function (err) {
    if (err) { return done(err); }
    savePost(API_URL, post, done);
  });
}

module.exports.failTask = failTask;
module.exports.completeTask = completeTask;
module.exports.extractPost = extractPost;
module.exports.saveTask = saveTask;
module.exports.checkAndSavePost = checkAndSavePost;