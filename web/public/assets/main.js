(function () {
  var buttonDiv, spinnerDiv, contentDiv;
  var min_date = Date.now();
  var moreAvailable = true;
  var RAF = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.oRequestAnimationFrame || function (fn) { setTimeout(fn, 0); };

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
    showSpinner();

    var request = new XMLHttpRequest();
    request.open('GET', '/api/post?max_date=' + min_date, true);

    request.onload = function() {
      if (this.status >= 200 && this.status < 400){
        // Success!
        var newItems = [];
        var resp = this.response;
        var posts = JSON.parse(resp);
        var old_min_date = min_date;
        for (var i=0, ii=posts.length; i<ii; i++) {
          var post = posts[i];
          post.width = parseInt(post.width, 10);
          post.height = parseInt(post.height, 10);
          post.published = parseFloat(post.published);
          console.log('comparing ' + [min_date, post.published] + ': ' + (min_date < post.published));
          min_date = Math.min(min_date, post.published);
          newItems.push(makePost(post));
        }
        if (old_min_date === min_date) {
          moreAvailable = false;
        }
        RAF(function () {
          for (var j=0, jj=newItems.length; j<jj; j++) {
            contentDiv.appendChild(newItems[j]);
          }
          hideSpinner();
        });
      }
    };

    request.send();
  }

  function onLoad () {
    spinnerDiv = document.querySelector('.spinner');
    contentDiv = document.querySelector('.content');
    buttonDiv = document.querySelector('.load-more');
    var button = document.querySelector('.load-more .btn');
    button.addEventListener('click', loadMore);
    loadMore();
  }

  document.addEventListener('DOMContentLoaded', onLoad);

})();