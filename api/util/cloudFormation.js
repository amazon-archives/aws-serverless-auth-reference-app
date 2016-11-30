'use strict';
var rfr = require('rfr');
var config = rfr('config');
var logger = rfr('util/logger');
var AWS = config.AWS;
var cf = new AWS.CloudFormation();
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');

var stackName = config.getName('stack');

function createStack() {
  return new Promise((resolve, reject) => {
    var filePath = path.join(__dirname, '../cloudformation/Spacefinder.json');
    if (!fs.existsSync(filePath)) {
      reject(new Error(`${filePath} does not exists!`));
    }
    var params = {
      StackName: stackName,
      TemplateBody: fs.readFileSync(filePath).toString(),
      Capabilities: [
        'CAPABILITY_IAM'
      ],
      DisableRollback: true,
      Parameters: [
        {ParameterKey: "ResourcePrefix", ParameterValue: config.getResourcePrefix()},
      ]
    };
    cf.createStack(params, (err) => {
      if (err) {
        if (err.toString().indexOf('already exists')>=0) {
          logger.info('Stack already exist, updating...');
          resolve(updateStack(params));
        }
        reject(err);
        return;
      }
      logger.info("Successfully invoked the CloudFormation stack " + params.StackName);
      resolve(pollStack(params));
    });
  });
}

function updateStack(params) {
  return new Promise((resolve, reject) => {
    // Delete 'DisableRollback' key from params object if it exists since it is only applicable to create stack requests
    if (params.DisableRollback) {
      delete params.DisableRollback;
    }

    cf.updateStack(params, (err) => {
      if (err) {
        if (err.toString().indexOf('No updates are to be performed')>=0) {
          resolve(pollStack(params));
        }
        reject(err);
        return;
      }
      logger.info("Successfully updated the CloudFormation stack " + params.StackName);
      resolve(pollStack(params));
    });
  });
}

function deleteStack() {
  return new Promise((resolve, reject) => {
    // First check for any S3 buckets and empty them, since a non-empty S3 bucket cannot be deleted by CloudFormation
    getStackOutputs().then((cfOutputs) => {
      var s3 = rfr('util/s3');
      let emptyBucketPromises = [];
      for (let output in cfOutputs) {
        if (output.includes('Bucket')) {
          logger.info('Emptying S3 bucket', cfOutputs[output]);
          emptyBucketPromises.push(s3.emptyBucket(cfOutputs[output]));
        }
      }
      Promise.all(emptyBucketPromises).then(() => {
        var params = {
          StackName: stackName
        };
        cf.deleteStack(params, (err) => {
          if (err) {
            logger.error(err);
            reject(err);
            return;
          }
          logger.info("Successfully deleted the CloudFormation stack " + params.StackName);
          pollStack(params).catch((err) => {
            if (err.message.indexOf('does not exist')) {
              // Stack deleted.
              resolve();
              return;
            }
            reject(err);
          });
        });
      }).catch((err) => {
        logger.error(err);
        reject(err);
      })
    });
  });
}

function pollStack(params) {
  return new Promise((resolve, reject) => {
    cf.describeStacks({StackName : params.StackName}, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      var stack = data.Stacks[0];
      switch (stack.StackStatus) {
        case 'CREATE_COMPLETE':
        case 'UPDATE_COMPLETE':
          logger.info('Stack operation completed');
          resolve(data);
          return;
        case 'ROLLBACK_COMPLETE':
        case 'CREATE_FAILED':
        case 'UPDATE_FAILED':
        case 'DELETE_FAILED':
        case 'UPDATE_ROLLBACK_COMPLETE':
          logger.warn(yaml.dump(data));
          reject(new Error('Stack mutation failed'));
          return;
      }
      logger.info('Waiting for stack mutation. This may take some time - ' + stack.StackStatus);
      setTimeout(function() {
        resolve(pollStack(params));
      }, 5000);
    });
  });
}

function getStackOutputs() {
  return new Promise((resolve, reject) => {
    cf.describeStacks({StackName: stackName}, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      var stack = data.Stacks[0];
      var obj = {};
      // Iterate through outputs array to find desired output key and return corresponding value
      for (var i = 0; i < stack.Outputs.length; i++) {
        obj[stack.Outputs[i].OutputKey] = stack.Outputs[i].OutputValue;
      }
      resolve(obj);
    });
  });
}

module.exports = {
  createStack,
  deleteStack,
  getStackOutputs,
  updateStack,
};
