// mark all completed twitter tasks as pending so that they can be reprocessed
var azure = require('azure-storage');
var retryOperations = new azure.ExponentialRetryPolicyFilter();
var tableSvc = azure.createTableService().withFilter(retryOperations);

var query = new azure.TableQuery().where('PartitionKey eq ?', 'twitter').and('status eq ?', 'failed');

var results = [];

function updateTasks () {
  var batch = new azure.TableBatch();
  // can only batch 100 commands
  var entities = results.splice(0, 100);

  entities.forEach(function (entity) {
    entity.status._ = 'pending';
    batch.updateEntity(entity);
  });
  console.log('updating ' + entities.length + ' tasks');
  tableSvc.executeBatch('tasks', batch, function (error) {
    if (error) {
      throw error;
    }
    if (results.length > 0) {
      updateTasks();
    }
  });
}

function onTasks (error, result) {
  if (error) {
    throw error;
  }
  results = results.concat(result.entries);
  if (result.continuationToken) {
    tableSvc.queryEntities('tasks', query, result.continuationToken, onTasks);
  } else {
    console.log('found ' + results.length + ' tasks');
    updateTasks();
  }
}
tableSvc.queryEntities('tasks', query, null, onTasks);
