var _ = require('underscore');
var uuid = require('node-uuid');

function Post (attributes) {
  _.defaults(this, attributes, {
    id: uuid.v1(),
    created: Date.now(),
    link: null,
    url: null,
    width: 0,
    height: 0,
    published: Date.now(),
    title: "",
    author: "",
    status: "active"
  });
}

Post.prototype.toEntity = function (entityGenerator) {
  var result = {
    PartitionKey: entityGenerator.String('post'),
    RowKey: entityGenerator.String(this.id),
    created: entityGenerator.Int64(this.created),
    published: entityGenerator.Int64(this.published),
    width: entityGenerator.Int64(this.width),
    height: entityGenerator.Int64(this.height),
    title: entityGenerator.String(this.title),
    author: entityGenerator.String(this.author),
    status: entityGenerator.String(this.status),
    link: entityGenerator.String(this.link),
    url: entityGenerator.String(this.url)
  };
  return result;
};

Post.fromEntity = function (entity) {
  var obj = {
    id: entity.RowKey._
  };
  _.each(_.omit(entity, 'RowKey', 'PartitionKey'), function (val, key) {
    obj[key] = val._;
  });
  return new Post(obj);
};

Post.prototype.toJSON = function () {
  return _.pick(this, 'id', 'created', 'link', 'url', 'width', 'height', 'published', 'title', 'author', 'status');
};


module.exports = Post;