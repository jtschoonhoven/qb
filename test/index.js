var fs   = require('fs');
var path = require('path');

var files  = fs.readdirSync(__dirname);
var filter = '.test.js';

// Require each test file in directory.
files.forEach(function(file) {
  if (file.indexOf(filter, file.length - filter.length) !== -1) { 
    require(path.join(__dirname, file)); 
  }
});