
var sql = require('sql');



// =============
// Query builder
// =============



// Create the root constructor function.
// The models object contains models defined by the sql package.
// The schema object is a map of the db structure.
// The definitions object is a copy of user-defined definitions.

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

	// Create "schema" which shows all fields that exist
	// on, or can be joined to, each table.

	for (var table in this.definitions) {
		var schema = this.schema[table] = {};
		var definition = this.definitions[table];
		schema[table] = definition.columns.map(function(col) { 
			return col.name; 
		});

		// Include join columns.
		for (join in definition.joins) {
			var joinTable = that.definitions[join];
			schema[join] = joinTable.columns.map(function(col) { 
				return col.name; 
			});
		}
	}
};



// Assemble query to spec. Returns a string of SQL.
Qb.prototype.query = function(spec) {
	var that = this;

	querySetup.call(this, spec);
	var query = this.models[spec.table].select([]);

	select.call(this, query, spec);
	createFromClause.call(this, query, spec);
	createWhereClause.call(this, query, spec);

	console.log('\n')
	console.log(query.toQuery().text);

	this.lastQuery = query.toQuery();
	return query.toQuery().text;
};



// Set defaults and build instances of DB models.
function querySetup(spec, joined, alias) {
	var that = this;

	// Keep track of each joined model in spec.
	joined = joined || {};

	// Defaults.
	spec.fields  = spec.fields  || [];
	spec.joins   = spec.joins   || [];

	// Avoid joining a table twice with the same name by 
	// appending an _{index} to table alias.

	var name = alias || spec.table;
	if (joined[name]) { alias = name + '_' + joined[name]++; }
	else { joined[name] = 2; }

	// Create a table model from spec. Apply alias if defined.
	spec.model = this.models[spec.table].as(alias);

	// Call function recursively for each nested join.
	spec.joins.forEach(function(joinSpec, index) {
		alias   = that.definitions[spec.table].joins[joinSpec.table].as;
		var via = that.definitions[spec.table].joins[joinSpec.table].via

		// If "via" defines an intermediate table, alter the spec to
		// join through that table.

		if (via) { 
			spec.joins[index] = { 
				table: via, 
				joins: [{ table: joinSpec.table, fields: joinSpec.fields }] 
			};
		}

		// Call function recursively for each join.
		querySetup.call(that, spec.joins[index], joined, alias);
	});
}



function select(query, spec) {
	var that = this;

	var fields = spec.fields.map(function(field) { 
		return spec.model[field]; 
	});

	query.select(fields);

	spec.joins.forEach(function(joinSpec) {
		select.call(that, query, joinSpec);
	});
}



function from(query, spec, from) {
	var that = this;
	if (!from) { from = spec.model; }

	spec.joins.forEach(function(joinSpec, index) {
		from.call(that, query, spec.joins[index], from);
	});
}



// Apply JOIN logic.
function createFromClause(query, spec) {
	var that = this;
	var from = joinAll.call(this, null, spec.table, spec.joins);
	query.from(from);
}



// Call "joinModel" on each join in spec.
function joinAll(from, table, joins) {
	var that = this;
	var from = from || this.models[table];

	// Join each model listed in "joins" array to "model".
	joins.forEach(function(join) {
		from = joinModel.call(that, from, table, join.table);
		// If child joins are defined, recursively call joinAll.
		if (join.joins) {
			from = joinAll.call(that, from, join.table, join.joins);
		}
	});

	return from;
}


// Create a single JOIN clause between "model" and "join".
// TODO: Allow joining the same table more than once.
function joinModel(from, table, join) {
	var that = this;

	var sourceDef = this.definitions[table];
	var targetDef = this.definitions[join];

	if (!sourceDef) { throw 'Failed to find "' + table + '" in list of defined tables.'; }
	if (!targetDef) { throw 'Failed to find "' + join + '" in list of defined tables.'; }

	var sourceModel = this.models[table];
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

	if (this.schema[table][table].indexOf(sourceKey) < 0) { throw 'Failed to find join column "' + sourceKey + '" in table "' + model + '".'; }
	if (this.schema[table][join].indexOf(targetKey) < 0) { throw 'Failed to find join column "' + targetKey + '" in table "' + join + '".'; }

	// Get intermediate table, if any.
	var via = sourceDef.joins[join].via;

	// Special logic to handle joining via an intermediate table.
	if (via) {
		from = joinModel.call(this, from, table, via);
		return joinModel.call(this, from, via, join);
	}

	// Return a JOIN clause.
	return from.join(targetModel).on(sourceModel[sourceKey].equals(targetModel[targetKey]));
}



// Apply where conditions and AND/OR logic.
function createWhereClause(query, spec) {
	var that  = this;
	var model = this.models[spec.table];

	spec.filters = spec.filters || [];

	// "Where" is an outer array of AND conditions.
	spec.filters.forEach(function(and) {
		var orClauses = [];

		// "And" is an inner array of OR conditions.
		and.forEach(function(or) {
			var model  = that.models[or.table];
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
