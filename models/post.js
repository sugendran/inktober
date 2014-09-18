var _ = require('underscore');

function Post (attributes) {
  _.defaults(this, attributes, {
    created_at: Date.now(),
    taskId: null,
    source: null,
    link: null,
    image: null,
    width: 0,
    height: 0,
    username: "",
    text: ""
  });
}

module.exports = Post;