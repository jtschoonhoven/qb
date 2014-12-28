
var sql = require('sql');
var _   = require('underscore');



// =============
// Query builder
// =============



// Create the root constructor function.
// The models object contains models defined by the sql package.
// The schema object is a map of the db structure.
// The definitions object is a copy of user-defined definitions.

function Qb(definitions) {
	this.models = {};
	this.schema = [];
	this.definitions = {};
	if (definitions) { this.define(definitions); }
}



// Define models and relationships.
// This is done just once to configure the Qb instance.

Qb.prototype.define = function(definitions) {
	var that = this;

	// Call sql.define on each model in definition.
	for (var def in definitions) {
		this.definitions[def] = normalize(definitions[def]);
		this.models[def] = sql.define(this.definitions[def]);
	}

	// Populate "schema" with each table in definitions.
	// Include arrays of columns and allowed join tables.

	for (def in this.definitions) {
		var definition = that.definitions[def];
		var table      = { id: def, name: definition.as };
		table.columns  = definition.columns.map(function(col) {
			return col.property;
		});

		// Add array of tables that may be joined on table.
		table.joins = [];
		for (var join in definition.joins) {
			table.joins.push({ id: join, name: definition.joins[join].as });
		}

		// Add table to schema.
		this.schema.push(table);
	}
};



// Assemble query to spec. Returns a string of SQL.
Qb.prototype.query = function(spec) {
	var that = this;

	querySetup.call(this, spec);
	var query = this.models[spec.from].select([]);

	join.call(this, query, spec);
	// select.call(this, query, spec);
	// where.call(this, query, spec);

	console.log('\n');
	console.log(query.toQuery().text);

	this.lastQuery = query.toQuery();
	return query.toQuery().text;
};



// Default values and validation.
function querySetup(spec, joined, alias) {
	var that = this;

	if (!spec) { throw '"Query" called without parameters.'; }

	// Allow user to use some alternate keys.
	spec.from    = spec.from    || spec.table;
	spec.selects = spec.selects || spec.select || spec.fields;
	spec.joins   = spec.joins   || spec.join   || spec.include;
	spec.wheres  = spec.wheres  || spec.where  || spec.filters;
	spec.groups  = spec.groups  || spec.group  || spec.groupBy;

	// Query requires a "from" and "selects" at minimum.
	if (!spec.from)    { throw '"From" string not set.'; }
	if (!spec.selects) { throw '"Select" array not set.'; }

	// Ensure specified table has been defined.
	if (!this.models[spec.from]) { 
		throw '"' + spec.from + '" is not a defined model.'; 
	}

	// Fill in any missing params.
	_.defaults(spec, { wheres: [], groups: [], limit: false });

	// // Avoid joining a table twice with the same name by 
	// // appending an _{index} to table alias.

	// var name = alias || spec.table;
	// if (joined[name]) { alias = name + '_' + joined[name]++; }
	// else { joined[name] = 2; }

	// // Create a table model from spec. Apply alias if defined.
	// spec.model = this.models[spec.table].as(alias);

	// // Call function recursively for each nested join.
	// spec.joins.forEach(function(joinSpec, index) {
	// 	alias   = that.definitions[spec.table].joins[joinSpec.table].as;
	// 	var via = that.definitions[spec.table].joins[joinSpec.table].via;

	// 	// If "via" defines an intermediate table, alter the spec to
	// 	// join through that table.

	// 	if (via) { 
	// 		spec.joins[index] = { 
	// 			table: via, 
	// 			joins: [{ table: joinSpec.table, fields: joinSpec.fields }] 
	// 		};
	// 	}

	// 	// Call function recursively for each join.
	// 	querySetup.call(that, spec.joins[index], joined, alias);
	// });
}


// Join each table in spec.joins array.
function join(query, spec) {
	var that = this;

	// Each join in array will be joined to this model.
	var joins = this.models[spec.from];

	spec.joins.forEach(function(join) {

		// Get name, model and definition of table being joined.
		var joinTable = join.table;
		var joinModel = that.models[joinTable];
		var joinDef   = that.definitions[joinTable];

		// Get the name of the source table (that being joined ON).
		// If no joinId is given, default to FROM table.

		if (join.joinId) { 
			var sourceTable = _.findWhere(spec.joins, { id: join.joinId }).table; 
		} else { 
			var sourceTable = spec.from; 
		}

		// Get model and defintion of table being joined ON.
		var sourceModel = that.models[sourceTable];
		var sourceDef   = that.definitions[sourceTable];

		// Get keys for join. Default to primary key if source/target keys are not set.
		var sourceKey = sourceDef.joins[joinTable].source_key || sourceDef.primary_key;
		var joinKey   = sourceDef.joins[joinTable].target_key || targetDef.primary_key;

		joins = joins.join(joinModel).on(sourceModel[sourceKey].equals(joinModel[joinKey]));
	});

	// Apply joins to query.
	query.from(joins);
}


// function select(query, spec) {
// 	var that = this;

// 	var fields = spec.selects.map(function(select) {
// 		return spec.model[select]; 
// 	});

// 	query.select(fields);

// 	spec.joins.forEach(function(joinSpec) {
// 		select.call(that, query, joinSpec);
// 	});
// }


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
			return { name: col, property: col };
		}
		return { name: col.name, property: col.as || col.name };
	});

	// If primary key isn't set, use "id" alias or simplye "id".
	if (!model.primary_key) {
		model.primary_key = _.findWhere(model.columns, {name: 'id'}).property || 'id';
	}
	model.as = model.as || model.name;

	return model;
}



module.exports = Qb;
