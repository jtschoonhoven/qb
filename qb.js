
var sql = require('sql');



// Create the root constructor function.
// The models object contains models defined by the sql package.
// The schema object is a map of the db structure.
function Qb(definitions) {
	this.models = {};
	this.schema = {};
	this.definitions = {};
	if (definitions) { this.define(definitions); }
}



// Define models and relationships.
// This is done just once to configure the Qb instance.
Qb.prototype.define = function(definitions) {
	var that = this;
	this.definitions = definitions;

	// Call sql.define on each model in definition.
	for (var table in definitions) {
		var model = normalize(definitions[table]);
		this.models[table] = sql.define(model);
	}

	// Create an object that maps all related columns to a model.
	for (var table in this.definitions) {
		var schema = this.schema[table] = {};
		var definition = this.definitions[table];

		if (!definition) { 
			throw 'Failed to find table "' + table + '" in schema definition.';
		}

		schema[table] = definition.columns.map(function(col) { 
			return col.name; 
		});

		// Include columns that can be joined to a model.
		for (join in definition.joins) {
			var joinTable = that.definitions[join];

			if (!joinTable) { 
				throw 'Failed to find join table "' + join + '" in schema definition.';
			}

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
	var model   = spec.model
	var fields  = spec.fields  || [];
	var where   = spec.where   || [];
	var joins   = spec.joins   || [];
	var groupBy = spec.groupBy || [];

	// Assemble query.
	var query = this.models[model].select(fields);
	createFromClause.call(this, query, model, joins);
	createWhereClause.call(this, query, model, where);

	console.log(query.toQuery().text);
};




// Apply JOIN logic.
function createFromClause(query, model, joins) {
	var that = this;
	var from = joinAll.call(this, null, model, joins);
	query.from(from);
}



// Call "joinModel" on each join in spec.
function joinAll(from, model, joins) {
	var that = this;
	var from = from || this.models[model];

	// Join each model listed in "joins" array to "model".
	joins.forEach(function(join) {
		from = joinModel.call(that, from, model, join.model);
		// If child joins are defined, recursively call joinAll.
		if (join.joins) { 
			from = joinAll.call(that, from, join.model, join.joins);
		}
	});

	return from;
}


// Create a single JOIN clause between "model" and "join".
// TODO: Allow joining the same table more than once.
function joinModel(from, model, join) {
	var that = this;

	var sourceDef = this.definitions[model];
	var targetDef = this.definitions[join];

	if (!sourceDef) { throw 'Failed to find "' + model + '" in list of defined tables.'; }
	if (!targetDef) { throw 'Failed to find "' + join + '" in list of defined tables.'; }

	var sourceModel = this.models[model];
	var targetModel = this.models[join];

	var joinAlias = sourceDef.joins[join].as;
	targetModel = targetModel.as(joinAlias);

	// Get the primary keys of the tables to use as default join key.
	var sourcePrimaryKey = sourceDef.primary_key || 'id';
	var targetPrimaryKey = targetDef.primary_key || 'id';

	if (!sourceDef.joins[join]) { throw 'Failed to join "' + join + '" on "' + model + '": join logic not defined.'; }

	// Join on defined source_key or default to primary key.
	var sourceKey = sourceDef.joins[join].source_key || sourcePrimaryKey;
	var targetKey = sourceDef.joins[join].target_key || targetPrimaryKey;

	if (this.schema[model][model].indexOf(sourceKey) < 0) { throw 'Failed to find join column "' + sourceKey + '" in table "' + model + '".'; }
	if (this.schema[model][join].indexOf(targetKey) < 0) { throw 'Failed to find join column "' + targetKey + '" in table "' + join + '".'; }

	// Get intermediate table, if any.
	var via = sourceDef.joins[join].via;

	// Special logic to handle joining via an intermediate table.
	if (via) {
		from = joinModel.call(this, from, model, via);
		return joinModel.call(this, from, via, join);
	}

	// Return a JOIN clause.
	return from.join(targetModel).on(sourceModel[sourceKey].equals(targetModel[targetKey]));
}



// Apply where conditions and AND/OR logic.
function createWhereClause(query, model, where) {
	var that  = this;
	var model = this.models[model];

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
