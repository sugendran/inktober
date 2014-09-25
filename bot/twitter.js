var Task = require('../models/task');
var taskUtils = require('./task-utils');
var tu;
var terms = ['inktober'];
// jake parker = 13205002
var canRetweetAlways = ['13205002'];
var lastRetweets = [];
var now = new Date();
var startDate = Date.UTC(now.getFullYear(), 8, 31);
var endDate = Date.UTC(now.getFullYear(), 10, 1);


// only keep the values for the last hour
setInterval(function () {
  var now = Date.now() - 60 * 60 * 1000;
  lastRetweets = lastRetweets.filter(function (val) { return val >= now; });
}, 1000);

module.exports.init = function (plugin) {
  tu = require('tuiter')(plugin.app.config.twitter);

  function onReTweet(err) {
    if (err) {
        console.error("retweeting failed :(");
        console.error(err);
    }
  }

  function onTweet(tweet) {
    // if it's flagged as a retweet or has RT
    // in there then we probably don't want
    // to retweet it again.
    if (tweet.retweeted) {
        return;
    }
    if (tweet.text.indexOf("RT") !== -1) {
        return;
    }
    var txt = tweet.text.toLowerCase();
    if (terms.indexOf(txt) !== -1) {
      return;
    }

    var date = null;
    try {
      date = Date.parse(tweet.created_at);
    } catch (e) {

    }
    if ((canRetweetAlways.indexOf(tweet.id_str) !== -1) || (date && date <= endDate && date >= startDate)) {
      lastRetweets.push(Date.now());
      // console.log("Retweeting: " + tweet.text);
      // note we're using the id_str property since
      // javascript is not accurate for 64bit ints
      tu.retweet({
          id: tweet.id_str
      }, onReTweet);
    }

    var task = new Task({
      source: "twitter",
      sourceId: tweet.id_str,
      payload: tweet
    });
    taskUtils.saveTask('http://127.0.0.1:' + plugin.app.config.ports.api, task);
  }


  tu.filter({
      track: terms
  }, function(stream) {
      console.log('listening to twitter stream');
      stream.on('tweet', onTweet);
  });
};

module.exports.health = function () {
  return lastRetweets.length + ' retweets per hour';
};