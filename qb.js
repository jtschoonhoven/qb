
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
	from.call(this, query, spec);
	where.call(this, query, spec);

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



function from(query, spec) {
	var tables = joinTable.call(this, spec, spec.model); 
	query.from(tables);
}



function joinTable(spec, from) {
	var that = this;

	var sourceName  = spec.table;
	var sourceModel = spec.model;
	var sourceDef   = this.definitions[sourceName];

	spec.joins.forEach(function(joinSpec, index) {
		var targetName  = joinSpec.table;
		var targetModel = joinSpec.model;
		var targetDef   = that.definitions[targetName];

		var sourceKey = sourceDef.joins[targetName].source_key || sourceDef.primary_key;
		var targetKey = sourceDef.joins[targetName].target_key || targetDef.primary_key;

		from = from.join(targetModel).on(sourceModel[sourceKey].equals(targetModel[targetKey]));
		from = joinTable.call(that, joinSpec, from);
	});

	return from;
}


// Apply where conditions and AND/OR logic.
function where(query, spec) {
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
