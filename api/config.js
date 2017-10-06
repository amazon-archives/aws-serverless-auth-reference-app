'use strict';

var defaults = {
  AWS_PROFILE: 'default',
  AWS_REGION: 'us-east-1',
  ENVIRONMENT_STAGE: 'development',
  PROJECT_PREFIX: 'spacefinder-',
  PACKAGE_VERSION: '1.0.0'
};

function getVar(name) {
  if (process.env[name]){
    console.log('Getting value', name, 'from environmental variable with value', process.env[name], ' overriding ', defaults[name]);
    return process.env[name];
  }
  return defaults[name];
}

var config = {
  AWS_PROFILE: getVar('AWS_PROFILE'),
  AWS_REGION: getVar('AWS_REGION'),
  ENVIRONMENT_STAGE: getVar('ENVIRONMENT_STAGE'),
  PROJECT_PREFIX: getVar('PROJECT_PREFIX'),
  PACKAGE_VERSION: getVar('PACKAGE_VERSION')
};

// For local development, define these properties before requiring the SDK since it will provide the right credentials
if (!process.env.LAMBDA_TASK_ROOT) {
  // Code is not running in a Lambda container, set AWS profile to use
  process.env.AWS_PROFILE = config.AWS_PROFILE;
  process.env.AWS_REGION = config.AWS_REGION;
}

// Attach this AWS object with credentials setup for other methods.
config.AWS = require('aws-sdk');
config.getName = (suffix) => {
  return config.getResourcePrefix() + suffix;
};
config.getResourcePrefix = () => {
  return config.PROJECT_PREFIX + config.ENVIRONMENT_STAGE + '-';
};
config.getLambdaZipName = () => {
  return 'lambda-' + config.PACKAGE_VERSION + '.zip';
};
config.getLambdaZipPath = () => {
  var path = require('path');
  return path.join(__dirname, 'dist', 'lambda-' + config.PACKAGE_VERSION + '.zip');
};

module.exports = config;
