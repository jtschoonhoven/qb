var sql = require('sql')
,   fs  = require('fs');


// Read model definitions from file.
var associations = require('./example-models.js');


// An object to hold each SQL model definition.
var db = {};


// For each model defined in associations...
for (var key in associations) {
	var model = associations[key];

	// Set the primary key to "id" unless otherwise defined.
	model.primary_key = model.primary_key || 'id';

	// Call sql.define() on each model and add to db object.
	db[key] = sql.define(model);
}


var qb = {
	model: 'user',
	select: ['Join date'],
};


var model = db[qb.model];
var select = db.user[qb.select];
var from = db[qb.model];


// var query = model.select(select).from(from).toQuery();
// console.log(query.text);