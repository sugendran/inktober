var _ = require('underscore');
var uuid = require('node-uuid');

function Task (attributes) {
  _.defaults(this, attributes, {
    id: uuid.v1(),
    created: Date.now(),
    source: null,
    url: null,
    payload: null,
    status: "pending",
    started: 0
  });
}

Task.prototype.toEntity = function (entityGenerator) {
  var result = {
    PartitionKey: entityGenerator.String(this.source),
    RowKey: entityGenerator.String(this.id),
    created: entityGenerator.Int64(this.created),
    status: entityGenerator.String(this.status),
    source: entityGenerator.String(this.source),
    url: entityGenerator.String(this.url),
    payload: entityGenerator.String(this.payload),
    started: entityGenerator.Int64(this.started)
  };
  return result;
};

Task.fromEntity = function (entity) {
  var obj = {
    id: entity.RowKey._,
    created: entity.created._,
    status: entity.status._,
    source: entity.source._,
    started: entity.started._
  };
  return new Task(obj);
};

Task.prototype.toJSON = function () {
  return _.pick(this, 'id', 'created', 'source', 'url', 'payload', 'status');
};


module.exports = Task;