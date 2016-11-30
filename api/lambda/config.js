'use strict';
var fs = require('fs');
var path = require('path');

if (fs.existsSync(path.join(__dirname,'config-generated.js'))) {
  module.exports = require(path.join(__dirname,'config-generated.js'));
} else {
  // Read from relative path
  module.exports = require(path.join(__dirname,'..','config'));
}