'use strict';
var bunyan = require('bunyan');
var PrettyStream = require('bunyan-prettystream');

var prettyStdOut = new PrettyStream();
prettyStdOut.pipe(process.stdout);

var prettyStdErr = new PrettyStream();
prettyStdErr.pipe(process.stderr);

module.exports = bunyan.createLogger({
  name: 'spacefinder',
  streams: [{
    level: 'debug',
    type: 'raw',
    stream: prettyStdOut,
    reemitErrorEvents: true
  }]
});
