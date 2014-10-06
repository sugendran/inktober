var Task = require('../models/task');
var taskUtils = require('./task-utils');
var tu = null;
var stream = null;
var terms = ['inktober', '#inktober'];
var disallowed = ["\uD83D\uDC49","\uD83D\uDC48","\uD83D\uDC46","\uD83D\uDC46"];
// jake parker = 13205002
var canRetweetAlways = ['13205002'];
var lastRetweets = [];
var now = new Date();
var startDate = Date.UTC(now.getFullYear(), 8, 30);
var endDate = Date.UTC(now.getFullYear(), 10, 1);


// only keep the values for the last hour
setInterval(function () {
  var now = Date.now() - 60 * 60 * 1000;
  lastRetweets = lastRetweets.filter(function (val) { return val >= now; });
}, 1000);

function init(plugin) {
  if (tu == null) {
    tu = require('tuiter')(plugin.app.config.twitter);
  }

  if (stream !== null) {
    stream.emit('end');
    stream = null;
    setTimeout(function () {
      init(plugin);
    }, 1000);
    return;
  }

  function onReTweet(err) {
    if (err) {
        console.error("retweeting failed :(");
        console.error(err);
    }
  }

  function onTweet(tweet) {
    try {
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

      for (var i=0, ii=disallowed.length; i<ii; i++) {
        if (txt.indexOf(disallowed[i]) !== -1) {
          return;
        }
      }


      var date = null;
      try {
        date = Date.parse(tweet.created_at);
      } catch (e) {
        date = Date.now();
      }
      var hasEntities = (
          (tweet.entities.urls && tweet.entities.urls.length > 0) ||
          (tweet.entities.media && tweet.entities.media.length > 0)
        );
      if ( hasEntities &&
           (
            (canRetweetAlways.indexOf(tweet.id_str) !== -1) ||
            (date && date <= endDate && date >= startDate)
           )
         ) {
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
    catch (e) {
      console.log("failed to do things with the tweet");
      console.log(e.message);
    }
  }


  tu.filter({
      track: terms
  }, function(_stream) {
    stream = _stream;
    plugin.log(['plugin', 'info'], 'listening to twitter stream');
    stream.on('tweet', onTweet);
  });
}

module.exports.init = init;

module.exports.health = function () {
  return lastRetweets.length + ' retweets per hour';
};

setTimeout(function () {
  if (lastRetweets.length == 0) {
    throw new Error('twitter is dead, killing the process');
  }
}, 24 * 60 * 60 * 1000);
