'use strict';
var rfr = require('rfr');
var archiver = require('archiver');
var fs = require('fs');
var path = require('path');
var config = rfr('config');
var logger = rfr('util/logger');

function createLambdaZipFile() {
  return new Promise((resolve, reject) => {
    // Create dist directory if it does not exist
    let distDir = path.join(__dirname,'..','dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir);
      logger.info("Created 'dist' directory for Lambda zip");
    }
        
    var output = fs.createWriteStream(config.getLambdaZipPath());
    var archive = archiver.create('zip');

    output.on('close', function () {
      logger.info('Lambda zip archive written to ' + config.getLambdaZipName() + ' as ' + archive.pointer() + ' total bytes compressed');
      resolve(config.getLambdaZipPath());
    });

    archive.on('error', function(err){
      reject(err);
    });

    archive.pipe(output);
    // Add all Lambda folder files and directories to archive
    archive.directory(path.join(__dirname, '..', 'lambda'), '/');

    // Append generated config to local Lambda archive for reference at run-time
    archive.append(fs.createReadStream(path.join(__dirname,'..','config.js')), { name: 'config-generated.js' });
    archive.finalize();
  })
}

module.exports = {
  createLambdaZipFile
};