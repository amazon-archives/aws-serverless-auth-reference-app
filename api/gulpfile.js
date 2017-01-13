'use strict';
var gulp = require('gulp');
var rfr = require('rfr');
var util = require('./util');
var path = require('path');
var install = require('gulp-install');
var lambdaData = rfr('lambda/data');
var importer = rfr('util/importer');
var logger = rfr('util/logger');

function execPromise(promise, done) {
  try {
    promise.then(() => {
      done();
    }).catch((err) => {
      logger.error('step failed', err);
      done(err);
      // handleError(err);
    })
  } catch (e) {
    logger.error('Exception thrown', e);
    done(e);
  }
}

gulp.task('sleep', function (done) {
  const NUMBER_OF_MILLISECONDS_TO_SLEEP = 5000;
  logger.info(`Sleeping for ${NUMBER_OF_MILLISECONDS_TO_SLEEP} milliseconds`);
  execPromise(util.sleep(NUMBER_OF_MILLISECONDS_TO_SLEEP), done);
});

//TODO: Setup recursive npm install at later time
gulp.task('install', function (done) {
  gulp.src(path.join(__dirname, 'package.json'), path.join(__dirname, 'lambda', 'package.json'))
    .pipe(install());
  done();
});

gulp.task('create_cloudformation_stack', function (done) {
  logger.info('Creating CloudFormation stack...');
  execPromise(util.cloudFormation.createStack(), done);
});

gulp.task('delete_cloudformation_stack', function (done) {
  logger.info('Deleting CloudFormation stack...');
  execPromise(util.cloudFormation.deleteStack(), done);
});

gulp.task('create_cognito_pools', function (done) {
  logger.info('Creating Cognito Identity and User Pools...');
  execPromise(util.cognito.createCognitoPools(), done);
});

gulp.task('create_cognito_users', function (done) {
  logger.info('Creating Sample Cognito User Pools user accounts...');
  execPromise(util.importer.SampleData.generateSampleUsers(), done);
});

gulp.task('delete_cognito_pools', function (done) {
  logger.info('Deleting Cognito Identity and User Pools...');
  execPromise(util.cognito.deleteCognitoPools(), done);
});

gulp.task('create_dynamodb_tables', function (done) {
  logger.info('Creating DynamoDB tables...');
  let promises = [
    (new lambdaData.LocationsTable()).safeCreateTable(),
    (new lambdaData.BookingsTable()).safeCreateTable(),
    (new lambdaData.ProfilesTable()).safeCreateTable(),
    (new lambdaData.ResourcesTable()).safeCreateTable(),
  ];
  execPromise(Promise.all(promises), done);
});

gulp.task('delete_dynamodb_tables', function (done) {
  logger.info('Deleting DynamoDB tables');
  let promises = [
    (new lambdaData.LocationsTable()).deleteTable(),
    (new lambdaData.BookingsTable()).deleteTable(),
    (new lambdaData.ProfilesTable()).deleteTable(),
    (new lambdaData.ResourcesTable()).deleteTable(),
  ];
  execPromise(Promise.all(promises), done);
});

gulp.task('create_lambda_zip', function (done) {
  logger.info('Creating Lambda zip archive...');
  execPromise(util.archiver.createLambdaZipFile(), done);
});

gulp.task('upload_lambda_zip', function (done) {
  logger.info('Uploading Lambda zip archive to S3...');
  execPromise(util.s3.uploadLambdaZipToS3(), done);
});

gulp.task('create_lambda_functions', function (done) {
  logger.info('Creating Lambda functions from Swagger API definition...');
  execPromise(util.lambda.createFunctionsFromSwagger(), done);
});

gulp.task('create_custom_authorizer', function (done) {
  logger.info('Creating Custom Authorizer Lambda function...');
  execPromise(util.lambda.createCustomAuthorizerFunction(), done);
});

gulp.task('export_api', function (done) {
  logger.info('Exporting Swagger API definition from API Gateway...');
  execPromise(util.apigateway.exportApi(), done);
});

gulp.task('create_sdk', function (done) {
  logger.info('Generating Angular 2 TypeScript SDK Swagger API definition...');
  execPromise(util.swagger.createSdk(), done);
});

gulp.task('delete_export_api', function (done) {
  logger.info('Deleting exported Swagger API definition from API Gateway...');
  execPromise(util.apigateway.deleteApiExport(), done);
});

gulp.task('import_api', function (done) {
  logger.info('Importing Swagger API definition into API Gateway...');
  execPromise(util.apigateway.importApi(), done);
});

gulp.task('create_api_stage', function (done) {
  logger.info('Creating API stage deployment...');
  execPromise(util.apigateway.createApiStage(), done);
});

gulp.task('generate_client_config', function (done) {
  logger.info('Generating application client config...');
  execPromise(util.client.generateClientConfig(), done);
});

gulp.task('generate_sample_groups', function (done) {
  logger.info('Generating sample user groups..');
  execPromise(importer.SampleData.generateSampleUserGroups(), done);
});

gulp.task('assign_users_to_cognito_user_groups', function (done) {
  logger.info('Assigning users to groups...');
  execPromise(importer.SampleData.assignUsersToGroups(), done);
})

gulp.task('generate_sample_users', function (done) {
  logger.info('Generating sample users');
  execPromise(importer.SampleData.generateSampleUsers(), done);
});

gulp.task('generate_sample_data', function (done) {
  logger.info('Generating sample data');
  execPromise(new importer.SampleData().generateSampleData(), done);
});

gulp.task('delete_lambda_functions', function (done) {
  logger.info('Deleting Lambda functions...');
  execPromise(util.lambda.deleteFunctions(), done);
});

gulp.task('delete_cloudwatch_logs', function (done) {
  logger.info('Deleting CloudWatch Log Groups...');
  execPromise(util.cloudWatch.deleteLogGroups(), done);
});

gulp.task('deploy_api', gulp.series('import_api', 'sleep', 'create_api_stage'));

gulp.task('deploy_lambda', gulp.series('create_lambda_zip', 'upload_lambda_zip', 'create_lambda_functions', 'create_custom_authorizer'));

gulp.task('generate_sdk', gulp.series('export_api', 'create_sdk', 'delete_export_api'));


gulp.task('deploy', gulp.series(
  'create_cloudformation_stack',
  'create_dynamodb_tables',
  'create_cognito_pools',
  'generate_client_config',
  'deploy_lambda',
  'deploy_api',
  'generate_sample_data'   
));

gulp.task('bootstrap', gulp.series(
  'generate_sample_users',
  'generate_sample_groups',
  'sleep',
  'assign_users_to_cognito_user_groups'
));

gulp.task('undeploy', gulp.series(
  'delete_lambda_functions',
  'delete_cognito_pools',
  'delete_dynamodb_tables',
  'delete_cloudformation_stack',
  'delete_cloudwatch_logs'
));

gulp.task('default', gulp.series('bootstrap'));
