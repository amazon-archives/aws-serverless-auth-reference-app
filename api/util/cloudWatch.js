'use strict';
var rfr = require('rfr');
var logger = rfr('util/logger');
var config = rfr('config');
var AWS = config.AWS;
var cw = new AWS.CloudWatchLogs();

var logGroups = [];


function listLogGroups() {
  return new Promise((resolve, reject) => {
    logGroups = [];
    listLogGroupsImpl(null, '/aws/lambda/' + config.getResourcePrefix(), function (err) {
      if (err) {
        logger.error(err);
        reject(err);
      }
      resolve(logGroups);
    });
  });
}

function listLogGroupsImpl(nextToken, stringPattern, callback) {
  let params = {
    logGroupNamePrefix: stringPattern,
    nextToken: nextToken
  };
  cw.describeLogGroups(params, function (err, data) {
    if (err) {
      callback(err);
      return;
    }
    for (let i = 0; i < data.logGroups.length; i++) {
        logGroups.push(data.logGroups[i].logGroupName);
    }
    if (data.nextToken) {
      listLogGroupsImpl(data.nextToken, stringPattern, callback);
    } else {
      // All functions have been retrieved
      callback(null);
    }
  });
}

function deleteLogGroup(logGroupName) {
  return new Promise((resolve, reject) => {
    let params = {
      logGroupName: logGroupName
    };
    cw.deleteLogGroup(params, function(err, data) {
      if (err) {
        logger.error(err);
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}

function deleteLogGroups() {
  return new Promise((resolve, reject) => {
    listLogGroups().then((logGroupsArray) => {
      logger.info('CloudWatch log groups for deletion', logGroupsArray);
      let deleteLogGroupPromises = [];
      for (let i = 0; i < logGroupsArray.length; i++) {
        deleteLogGroupPromises.push(deleteLogGroup(logGroupsArray[i]));
      }
      Promise.all(deleteLogGroupPromises).then((data) => {
        logger.info('Deleted CloudWatch log groups successfully');
        resolve(data);
      }).catch((err) => {
        logger.error(err);
        reject(err);
      });
    });
  });
}

module.exports = {
  deleteLogGroups,
  listLogGroups
};
