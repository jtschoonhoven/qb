
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
// This is done only once to configure the Qb instance.

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



// Parse definition for use with sql.define().
function normalize(model) {
	model.columns = model.columns.map(function(col) {
		if (typeof col === 'string') {
			return { name: col, property: col };
		}
		return { name: col.name, property: col.as || col.name };
	});

	// If primary key isn't set, use "id" alias or simplye "id".
	if (!model.primary_key) { model.primary_key = 'id'; }
	model.as = model.as || model.name;

	return model;
}



// Assemble query to spec. Returns a string of SQL.
Qb.prototype.query = function(spec) {
	var that = this;

	querySetup.call(this, spec);
	var from  = spec.joins[0].table;
	var query = this.models[from].select([]);

	join.call(this, query, spec);
	// select.call(this, query, spec);
	// where.call(this, query, spec);

	var result    = query.toQuery().text;
	var formatted = formatSQL(result);

	console.log('\n');
	console.log(formatted);

	return formatted;
};



// Default values and basic validation.
function querySetup(spec, joined, alias) {
	var that = this;

	if (!spec) { throw '"Query" called without parameters.'; }

	// Allow user to use some alternate keywords in query spec.
	var selects = spec.selects = spec.selects || spec.select || spec.fields   || [];
	var joins   = spec.joins   = spec.joins   || spec.join   || spec.include  || [];
	var wheres  = spec.wheres  = spec.wheres  || spec.where  || spec.filters  || [];
	var groups  = spec.groups  = spec.groups  || spec.group  || spec.groupBy  || [];

	// Prepend spec.from to the joins array if exists.
	if (spec.from) { spec.joins.unshift({ table: spec.from }); }

	// Filter out any nonwhitelisted keys.
	selects.forEach(function(el, i) { selects[i] = _.pick(el, 'field', 'joinId'); });
	joins.forEach(function(el, i) { joins[i]     = _.pick(el, 'id', 'table', 'joinId'); });
	wheres.forEach(function(el, i) { wheres[i]   = _.pick(el); });
	groups.forEach(function(el, i) { groups[i]   = _.pick(el); });

	// Query requires a "from" and "select" at minimum.
	if (!spec.joins.length > 0)   { throw Error('No tables listed in FROM clause.'); }
	// if (!spec.selects.length > 0) { throw 'No fields listed in SELECT clause.'; }
}



// Join each table in spec.joins array.
function join(query, spec) {
	var that = this;

	var from  = spec.joins[0].table;
	var alias = this.definitions[from].as;
	var joins = this.models[from].as(alias);
	var names = [{ alias: alias, used: 1 }];

	// For each join in spec.joins, append a JOIN clause to
	// the "joins" model. Keep track of each alias and number
	// of times used in "names" array (avoids reusing alias).
	// Note that i=1, rather than i=0, correctly skips the
	// first element in spec.joins (which was joined above).

	for (var i=1; i<spec.joins.length; i++) {
		var join = spec.joins[i];
		joins = joinOnce.call(that, spec, join, joins, names);
	}

	query.from(joins);
}



// A single join operation. Called for each join in spec.joins.
function joinOnce(spec, join, joins, names) {

	// The "source" table is the table being joined ON. If not specified, this 
	// always defaults to the first join in spec.joins (the FROM table). 
	// To build a join clause we first need the following attributes:

	// sourceJoin:  The source from spec.joins (else default to FROM).
	// sourceTable: The name of the source table (else default to FROM).
	// sourceDef:   Definitions for source table for convenience.
	// sourceAlias: Use specified alias if exists, else take from sourceDef.
	// sourceModel: Lookup the SQL model for the source table.

	var sourceJoin  = _.findWhere(spec.joins, { id: join.joinId }) || spec.joins[0];
	var sourceTable = sourceJoin.table;
	var sourceDef   = this.definitions[sourceTable];
	var sourceAlias = sourceJoin.alias || sourceDef.as;
	var sourceModel = this.models[sourceTable].as(sourceAlias);

	// To make things easier, users are allowed to define intermediate
	// tables that can be joined through implicitly.

	var intermediate = sourceDef.joins[join.table].via;

	// If joining via intermediate table, join it before proceeding.
	// This just pushes a new join to spec.joins as if the user
	// had told us explicitly to join through that table.

	if (intermediate) {
		var viaId   = _.uniqueId('_via_');
		var joinVia = { table: intermediate, id: viaId, joinId: join.id };

		spec.joins.push(joinVia);
		join.joinId = viaId;

		joins = joinOnce.call(this, spec, joinVia, joins, names);
		joins = joinOnce.call(this, spec, join, joins, names);
		return joins;
	}

	// The "join" table is the table being joined. Similar to the
	// source attributes above, we need the table name and defs.

	var joinTable = join.table;
	var joinDef   = this.definitions[joinTable];

	// But before naming the new model, we need to grab its alias
	// and check whether it already exists in "names", the array
	// of aliases that have already been used.

	var joinAlias = joinDef.as || joinTable;
	var named     = _.findWhere(names, { alias: joinAlias });

	// If joinAlias has already been used, make a new alias by
	// appending an index to the old alias e.g. users_2.
	// Otherwise add joinAlias to names array.

	if (named) { 
		joinAlias = named.alias + '_' + (++named.used); 
	} else { 
		names.push({ alias: joinAlias, used: 1 }); 
	}

	// Now we can define and name the join model.
	var joinModel = this.models[joinTable].as(joinAlias);

	// Get keys for join. Default to primary key if source/target keys are not set.
	var sourceKey = sourceDef.joins[joinTable].source_key || sourceDef.primary_key;
	var joinKey   = sourceDef.joins[joinTable].target_key || joinDef.primary_key;

	// Get the alias ("AS") used for join/source key if exists, or just use the key as is.
	var sourceKeyAs = _.findWhere(sourceDef.columns, { name: sourceKey }).property || sourceKey;
	var joinKeyAs   = _.findWhere(joinDef.columns, { name: joinKey }).property || joinKey;

	// Add new join to joins and return.
	return joins.join(joinModel).on(sourceModel[sourceKeyAs].equals(joinModel[joinKeyAs]));
}



function select(query, spec) {
	var that = this;

	var fields = spec.selects.map(function(select) {
		return spec.model[select]; 
	});

	query.select(fields);

	spec.joins.forEach(function(joinSpec) {
		select.call(that, query, joinSpec);
	});
}


// // Apply where conditions and AND/OR logic.
// function where(query, spec) {
// 	var that  = this;
// 	var model = this.models[spec.table];

// 	spec.filters = spec.filters || [];

// 	// "Where" is an outer array of AND conditions.
// 	spec.filters.forEach(function(and) {
// 		var orClauses = [];

// 		// "And" is an inner array of OR conditions.
// 		and.forEach(function(or) {
// 			var model  = that.models[or.table];
// 			var clause = model[or.field][or.operator](or.value);
// 			orClauses.push(clause);
// 		});

// 		// Assemble a block or OR conditions from orClauses array.
// 		var block;
// 		if (orClauses.length > 1) { block = orClauses[0].or(orClauses.slice(1)); }
// 		else { block = orClauses[0]; }

// 		// Apply to query.
// 		query.where(block);
// 	});
// }



// Add linebreaks before keywords.
function formatSQL(sql) {
	var search  = /FROM|INNER JOIN|LEFT JOIN|RIGHT JOIN|OUTER JOIN|ON|WHERE|AND|GROUP BY|ORDER BY|LIMIT/g;
	var replace = '\n$&';
	return sql.replace(search, replace);
}


module.exports = Qb;
