// delete all posts
var azure = require('azure-storage');
var retryOperations = new azure.ExponentialRetryPolicyFilter();
var tableSvc = azure.createTableService().withFilter(retryOperations);

var query = new azure.TableQuery().where('PartitionKey eq ?', 'post');

var results = [];

function deletePosts () {
  var batch = new azure.TableBatch();
  // can only batch 100 commands
  var entities = results.splice(0, 100);
  entities.forEach(batch.deleteEntity, batch);
  tableSvc.executeBatch('posts', batch, function (error) {
    if (error) {
      throw error;
    }
    if (results.length > 0) {
      deletePosts();
    }
  });
}

function onPosts (error, result) {
  if (error) {
    throw error;
  }
  results = results.concat(result.entries);
  if (result.continuationToken) {
    tableSvc.queryEntities('posts', query, result.continuationToken, onPosts);
  } else {
    deletePosts();
  }
}
tableSvc.queryEntities('posts', query, null, onPosts);
