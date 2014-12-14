
var sql = require('sql');



// Create the root constructor function.
function Qb(definitions) {
	this.sql = sql;
	this.models = {};
	this.schema = {};
	this.definitions = {};
	if (definitions) { this.define(definitions); }
}



// Define models and relationships.
Qb.prototype.define = function(definitions) {
	var that = this;
	this.definitions = definitions;

	// Call sql.define on each model in definition.
	for (var table in definitions) {
		var model = normalize(definitions[table]);
		this.models[table] = sql.define(model);
	}

	// Create an object that maps all columns related to a model.
	for (var table in this.definitions) {
		var schema = this.schema[table] = {};
		var definition = this.definitions[table];
		schema[table] = definition.columns.map(function(col) { 
			return col.name; 
		});

		// Include columns that can be joined to a model.
		for (join in definition.joins) {
			var joinTable = that.definitions[join];
			schema[join] = joinTable.columns.map(function(col) { 
				return col.name; 
			});
		}
	}
};



// Assemble SQL query from to spec.
Qb.prototype.query = function(spec) {
	var that = this;

	// Query spec.
	var model   = this.models[spec.model];
	var fields  = spec.fields  || [];
	var where   = spec.where   || [];
	var groupBy = spec.groupBy || [];

	var query = model.select(fields).from(model);
	filter.call(this, query, where);

	console.log(query.toQuery().text)
};



// Apply where conditions and AND/OR logic.
function filter(query, where) {
	var that = this;

	// "Where" is an outer array of AND conditions.
	where.forEach(function(and) {
		var orClauses = [];

		// "And" is an inner array of OR conditions.
		and.forEach(function(or) {
			var model  = that.models[or.model];
			var clause = model[or.field][or.operator](or.value);
			orClauses.push(clause);
		});

		// Assemble a block or OR conditions from orClauses array.
		var block;
		if (orClauses.length > 1) { block = orClauses[0].or(orClauses.slice(1)); }
		else { block = orClauses[0]; }

		// Apply to query.
		query.where(block);
	});
}


// Parse definition for use with sql.define().
function normalize(model) {
	model.columns = model.columns.map(function(col) {
		if (typeof col === 'string') {
			return { name: col, property: col }
		}
		return { name: col.name, property: col.as || col.name }
	});

	model.primary_key = model.primary_key || 'id';
	return model;
}



module.exports = Qb;
