'use strict';
var rfr = require('rfr');
var logger = rfr('util/logger');
var path = require('path');
var fs = require('fs-extra');
var spawn = require('child_process').spawn;

let swaggerDir = path.join(__dirname,'..','swagger');
let apiSdkDir = path.join(swaggerDir,'generated');
let appSdkDir = path.join(__dirname,'..','..','app','src','services','spacefinder-sdk');

function createSdk() {
  // Create generated directory if it does not exist
  if (fs.existsSync(apiSdkDir)) {
    fs.removeSync(apiSdkDir);
    fs.mkdirSync(apiSdkDir);
  } else {
    fs.mkdirSync(apiSdkDir);
  }

  return new Promise((resolve, reject) => {
    // Run Swagger codegen locally to generate SDK files
    let cmd = spawn('swagger-codegen', ['generate', '-i', swaggerDir + '/SpacefinderAPI-exported.yml', '-l', 'typescript-angular2', '-o', apiSdkDir]);
    cmd.stdout.on('data', data => {
      process.stdout.write(data);
    });
    cmd.stderr.on('data', data => {
      process.stderr.write(data);
    });
    cmd.on('exit', code => {
      if (code) {
        reject(new Error(`Finished with exit code ${code}`));
        return;
      }
      resolve('Generated SDK successfully');
    });
  }).then(() => {
    // Clear any existing files from app SDK directory
    fs.removeSync(appSdkDir);
    fs.mkdirSync(appSdkDir);

    // Copy SDK from temporary generated directory
    fs.copySync(apiSdkDir,appSdkDir);
    logger.info('Successfully generated Angular2/TypeScript SDK at', appSdkDir);

    // Delete temporary generated SDK folder
    fs.removeSync(apiSdkDir);
    return 'Successfully generated SDK';
  });
}

module.exports = {
  createSdk
};
