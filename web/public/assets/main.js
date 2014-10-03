(function () {
  var spinnerDiv, contentDiv, buttonDiv;
  var moreAvailable = true;
  var newItems = [];
  var RAF = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.oRequestAnimationFrame || function (fn) { setTimeout(fn, 0); };

  var TWO_HOURS = (2 * 60 * 60 * 1000);
  var current_year = 2014;
  var before = Date.now();
  var after = Date.now() - TWO_HOURS;
  var minDate = Date.UTC(current_year, 8, 1);

  var matches = window.location.search.match(/year=(\d+)/);
  if (matches != null) {
    current_year = matches[1];
  }

  var beforeMatch = window.location.hash.match(/before=(\d+)/);
  if (beforeMatch != null) {
    before = parseInt(beforeMatch[1], 10);
  }

  var afterMatch = window.location.hash.match(/after=(\d+)/);
  if (afterMatch != null) {
    after = parseInt(afterMatch[1], 10);
  }

  function hideSpinner () {
    buttonDiv.style.display = moreAvailable ? 'block' : 'none';
    contentDiv.style.display = 'block';
    spinnerDiv.style.display = 'none';
  }

  function showSpinner () {
    buttonDiv.style.display = 'none';
    spinnerDiv.style.display = 'block';
  }

  function makePost (post) {
    var a = document.createElement('a');
    var img = document.createElement('img');
    var author = document.createElement('span');

    a.href = post.link;
    a.className = 'post';
    a.setAttribute('data-post-id', post.id);
    a.title = post.title;
    a.target = '_blank';

    author.innerText = post.author;
    author.className = 'author';
    a.appendChild(author);

    img.height = 200;
    if (post.width && post.height) {
      img.width = (200 / post.height) * post.width;
    }
    img.onload = function () {
      author.style.width = img.width + 'px';
    };
    img.src = post.url;
    a.appendChild(img);

    return a;
  }

  function loadMore () {
    var items = [];
    for (var i=0, ii=newItems.length; i<ii; i++) {
      items.push(makePost(newItems[i]));
    }
    newItems = [];
    RAF(function () {
      for (var j=0, jj=items.length; j<jj; j++) {
        contentDiv.appendChild(items[j]);
      }
      hideSpinner();
    });
  }

  function loadInfo () {
    showSpinner();

    var request = new XMLHttpRequest();
    window.location.hash = 'before=' + before + '&after=' + after;
    var url = '/post?year=' + current_year + '&before=' + before + '&after=' + after;

    request.open('GET', url, true);

    request.onload = function() {
      if (this.status >= 200 && this.status < 400){
        // Success!
        var resp = this.response;
        var posts = JSON.parse(resp);
        var earliest = Date.now();
        for (var i=0, ii=posts.length; i<ii; i++) {
          var post = posts[i];
          post.width = parseInt(post.width, 10);
          post.height = parseInt(post.height, 10);
          post.published = parseFloat(post.published);
          newItems.push(post);
          earliest = Math.min(post.published, earliest);
        }
        before = earliest - 1;
        after = earliest - TWO_HOURS;
        posts = posts.sort(function(a, b) {
          return b.published - a.published;
        });
        loadMore();
        moreAvailable = after > minDate;
      }
    };

    request.send();
  }

  function onLoad () {
    spinnerDiv = document.querySelector('.spinner');
    contentDiv = document.querySelector('.content');
    buttonDiv = document.querySelector('.load-more');
    var button = document.querySelector('.load-more .btn');
    button.addEventListener('click', loadInfo);
    loadInfo();
  }

  document.addEventListener('DOMContentLoaded', onLoad);

})();