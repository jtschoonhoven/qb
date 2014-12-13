var sql = require('sql')
,   fs  = require('fs');


// Read model definitions from file.
var associations = require('./example-models.js');

// An array of each model name.
var modelNames = Object.keys(associations);

// An object to hold each SQL model definition.
var models = {};

// modelNames.forEach(function(modelName) {
// 	models[modelName] = sql.define(associations)
// });

for (var key in associations) {
	var model = associations[key];
}

// var user = sql.define({
//   name: "user",
//   columns: [{
//       name: "id"
//     }, {
//       name: "state_or_province",
//       property: "state"
//     }
//   ]
// });