var request = require('request');
var Task = require('../models/task');
var config = require('../config');
var tu = require('tuiter')(config.twitter);

var max_id_str_search = null;
var max_id_str_trawl = null;

function onTweet (tweet) {
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
  }, function () {
    console.log(tweet.text);
  });
}

function trawl() {
  var opts = {
    user_id: 'inktober',
    screen_name: 'inktober',
    include_entities: 1,
    count: 200,
    exclude_replies: 1,
    include_rts: 1
  };
  if (max_id_str_trawl) {
    opts.max_id = max_id_str_trawl;
  }
  console.log(opts);
  tu.userTimeline(opts, function (err, result) {
    if (err) {
      console.error(err);
      return;
    }
    if (!result) { return; }
    if (result.constructor !== Array) {
      console.log(result);
      return;
    }
    if (result.length === 0) { return; }
    result.forEach(onTweet);
    var last = result[result.length - 1];
    if (max_id_str_trawl !== last.id_str) {
      max_id_str_trawl = last.id_str;
      trawl();
    }
  });
}


function search() {
  var opts = {
    q: 'inktober #inktober',
    include_entities: 1,
    count: 100,
    result_type: 'recent'
  };
  if (max_id_str_search) {
    opts.max_id = max_id_str_search;
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
        max_id_str_search = matches[1];
        search();
        return;
      }
    }
    trawl();
  });
}

search();