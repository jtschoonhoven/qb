
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



Qb.prototype.query = function(spec) {
	var fields  = spec.fields  || [];
	var groupBy = spec.groupBy || [];

	var model   = this.models[spec.model];
	var where = this.createWhereClauses(spec.where);
	
	var query = this.models.user.select(fields).where(where).toQuery()
	console.log(query.text)
};


// Create a where clause from user input.
// And/or groupings are implied by the order
// of nested arrays.
Qb.prototype.createWhereClauses = function(spec) {
	var that = this;
	spec = spec || [];

	var andClauses = [];
	spec.forEach(function(and) {
		var orClauses = [];

		and.forEach(function(or) {
			var clause = that.models[or.model][or.field][or.operator](or.value);
			orClauses.push(clause);
		});

		if (orClauses.length > 1) {
			var assembled = orClauses[0].or(orClauses.slice(1));
			andClauses.push(assembled);
		} 
		else { andClauses.push(orClauses[0]); }
	});

	return andClauses;
};



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
