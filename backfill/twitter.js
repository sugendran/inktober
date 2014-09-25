var request = require('request');
var Task = require('../models/task');
var config = require('../config');
var tu = require('tuiter')(config.twitter);
var terms = ['inktober'];

var max_id_str = null;

function onTweet (tweet) {
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

  var task = new Task({
    source: "twitter",
    sourceId: tweet.id_str,
    payload: tweet
  });

  request({
    url: 'http://127.0.0.1:' + config.ports.api + '/task',
    method: 'PUT',
    body: JSON.stringify(task.toJSON()),
    headers: {
      "Content-type": "application/json"
    }
  });
}

function search() {
  var opts = {
    q: 'inktober',
    include_entities: 1,
    count: 100,
    result_type: 'recent'
  };
  if (max_id_str) {
    opts.max_id = max_id_str;
  }

  tu.search(opts, function (err, result) {
    if (err) {
      console.error(err);
      return;
    }
    result.statuses.forEach(onTweet);
    if (result.search_metadata.next_results) {
      var matches = result.search_metadata.next_results.match(/max_id=(\d+)/);
      if (matches != null) {
        max_id_str = matches[1];
        setTimeout(search, 1000);
      }
    }
  });
}

search();