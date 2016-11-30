'use strict';

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = {
  archiver: require('./archiver'),
  client: require('./client'),
  cloudFormation: require('./cloudFormation'),
  cloudWatch: require('./cloudWatch'),
  cognito: require('./cognito'),
  importer: require('./importer'),
  lambda: require('./lambda'),
  logger: require('./logger'),
  s3: require('./s3'),
  apigateway: require('./apigateway'),
  swagger: require('./swagger'),
  sleep
};
