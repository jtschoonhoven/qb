
var sql = require('sql');
var _   = require('underscore');



// =============
// Query builder
// =============



// Create the root constructor function.
// The models object contains models defined by the sql package.
// The schema object is a map of the db structure.
// The definitions object is a copy of user-defined definitions.

function Qb(definitions, dialect) {
	this.models = {};
	this.schema = [];
	this.definitions = {};
	this.functions = sql.functions;

	if (dialect) { sql.setDialect(dialect); }
	if (definitions) { this.define(definitions); }
}



Qb.prototype.registerFunction = function(func) {
};



// Define models and relationships.
// This is done only once to configure the Qb instance.

Qb.prototype.define = function(definitions) {

	// Normalize and apply defaults.
	definitions = this.normalize(definitions);

	for (var tableName in definitions) {
		var tableDef = definitions[tableName];

		// Deep copy & modify columns for use with sql.define.
		var sqlColumns = _.toArray(tableDef.columns).map(function(col) { 
			return { name: col.name, property: col.property }
		});

		// Register the model with sql.define.
		var sqlDef = { name: tableName, columns: sqlColumns };
		this.models[tableName] = sql.define(sqlDef);
	}

	this.buildSchema(definitions);
	return definitions;
};



// Users may define columns and joins in a few different
// formats. Standardize formats and apply defaults.

Qb.prototype.normalize = function(definitions) {
	for (var tableName in definitions) {
		var tableDef = definitions[tableName];
		var columns  = {};

		// Columns may be defined as an object of strings/objects 
		// or as an array of strings/objects. These if/else blocks 
		// normalize the definitions and call sql.define on each.

		if (_.isArray(tableDef.columns)) {
			tableDef.columns.forEach(function(col) {

				if (_.isString(col)) { 
					columns[col] = { name: col, property: col }; 
				} 

				else if (_.isObject(col)) {
					var property = col.property || col.name;
					if (col.primary_key) { tableDef.primary_key = property; }
					columns[property] =  { name: col.name, property: property };
				}
			});
		}	

		else if (_.isObject(tableDef.columns)) {
			for (var colName in tableDef.columns) {
				var col = tableDef.columns[colName];

				if (!col || _.isString(col)) {
					var property = col || colName;
					columns[property] = { name: colName, property: property };
				}

				else if (_.isObject(col)) {
					var name = col.name || colName;
					var property = col.property || name;
					if (col.primary_key) { tableDef.primary_key = property; }
					columns[property] = { name: name, property: property };
				}
			}
		}
		tableDef.columns = columns;

		// If primary key is not set or else does not match a
		// defined column, check if it instead matches column name.
		// If that fails, set to column named "id", if exists.

		var pk = tableDef.primary_key;
		if (!tableDef.columns[pk]) {
			if (pk) { tableDef.primary_key = _.chain(columns).toArray().findWhere({ name: pk }).value(); }
			else {    tableDef.primary_key = _.chain(columns).toArray().findWhere({ name: 'id' }).value(); }
		}

		this.definitions[tableName] = tableDef;
	}

	return definitions;
};



// Create a map of the database (schema) that shows defined
// tables in the DB and how to join them. Qb.schema is
// meant to be exported for user by a service or end user.

Qb.prototype.buildSchema = function(definitions) {
	var schema = {};

	for (var tableName in definitions) {
		var tableDef = definitions[tableName];
	}


	// // Populate "schema" with tables from this.definitions.
	// for (tableName in this.definitions) {
	// 	var tableDef = this.definitions[tableName];



	// 	// Add array of tables that may be joined on table.
	// 	var joins = {};
	// 	for (var join in tableDef.joins) {
	// 		var joinDef  = tableDef.joins[join];
	// 		var joinName = joinDef.as || definitions[join].as;
	// 		var joinSpec = { id: join, name: joinName };

	// 		// Conditionally add join to list of joins.
	// 		if(!joinDef.hidden) { table.joins.push(joinSpec); }
	// 	}

	// 	// Conditionally add table to schema.
	// 	if (!tableDef.hidden) { this.schema.push(table); }
	// }
};



// Assemble query to spec. Returns a string of SQL.
Qb.prototype.query = function(spec) {
	var that = this;

	querySetup.call(this, spec);
	var from  = spec.joins[0].table;
	var query = this.models[from].select([]);

	join.call(this, query, spec);
	select.call(this, query, spec);
	// where.call(this, query, spec);
	// group.call(this, query, spec);

	this.lastQuery = query.toQuery();
	var result    = this.lastQuery.text;
	var formatted = formatSQL(result);

	console.log('\n');
	console.log(formatted);

	return formatted;
};



// Default values and basic validation.
function querySetup(spec, joined, alias) {
	var that = this;

	if (!spec) { throw Error('"Query" called without parameters.'); }

	// Allow user to use some alternate keywords in query spec.
	spec.selects = spec.selects || spec.select || spec.fields   || [];
	spec.joins   = spec.joins   || spec.join   || spec.include  || [];
	spec.wheres  = spec.wheres  || spec.where  || spec.filters  || [];
	spec.groups  = spec.groups  || spec.group  || spec.groupBy  || [];

	// Prepend spec.from to the joins array if exists.
	if (spec.from) { spec.joins.unshift({ table: spec.from }); }

	// For each array, convert to object if given as
	// string and whitelist keys.

	spec.selects = spec.selects.map(function(el) {
		if (typeof el === 'string') { return { field: el }; }
		return _.pick(el, 'functions', 'field', 'joinId'); 
	});

	spec.joins = spec.joins.map(function(el) {
		if (typeof el === 'string') { return { table: el }; }
		return _.pick(el, 'id', 'table', 'joinId'); 
	});

	// Query requires a "from" and "select" at minimum.
	if (!spec.joins.length > 0)   { throw Error('No tables listed in FROM clause.'); }
	if (!spec.selects.length > 0) { throw Error('No fields listed in SELECT clause.'); }
}



// Join each table in spec.joins array.
function join(query, spec) {
	var that = this;

	// For each join in spec.joins, append a JOIN clause to
	// the "joins" model. Keep track of each alias and number
	// of times used in "names" array (avoids reusing alias).

	var from  = spec.joins[0].table;
	var alias = this.definitions[from].as;
	var joins = this.models[from].as(alias);
	var names = [{ alias: alias, used: 1 }];

	// Save model of FROM table to spec.joins.
	spec.joins[0].model = joins;

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

	var sourceJoin = _.findWhere(spec.joins, { id: join.joinId }) || spec.joins[0];
	var sourceDef  = this.definitions[sourceJoin.table];

	// Intermediate tables are joined through implicitly according
	// to the "via" attribute in definitions. Intermediates sit
	// in between a join table and its defined source.

	var intermediate = sourceDef.joins[join.table].via;

	if (intermediate) {
		var viaId = _.uniqueId('_via_');

		// Define a join between the intermediate table and the current source
		// in the same format as an element of spec.joins. Add the join to a
		// stubbed "spec" object that we'll use in a moment.

		var joinVia  = { table: intermediate, id: viaId, joinId: join.joinId };
		var joinSpec = { joins: [joinVia] };

		// Update current join so it joins via the intermediate table.
		join.joinId = viaId;

		// Join the intermediate to the current source, then join the
		// current join to the intermediate using the stubbed joinSpec.

		joins = joinOnce.call(this, spec, joinVia, joins, names);
		joins = joinOnce.call(this, joinSpec, join, joins, names);

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

	join.model = this.models[joinTable].as(joinAlias);

	// Get keys for join. Default to primary key if source/target keys are not set.
	var sourceKey = sourceDef.joins[joinTable].source_key || sourceDef.primary_key;
	var joinKey   = sourceDef.joins[joinTable].target_key || joinDef.primary_key;

	// Get the alias ("AS") used for join/source key if exists, or just use the key as is.
	sourceKey = _.findWhere(sourceDef.columns, { name: sourceKey }).property || sourceKey;
	joinKey   = _.findWhere(joinDef.columns, { name: joinKey }).property || joinKey;

	// Add a JOIN clause and return joins.
	return joins.join(join.model).on(sourceJoin.model[sourceKey].equals(join.model[joinKey]));
}



// Add a SELECT clause for each field in spec.selects.
function select(query, spec) {
	var that = this;
	spec.selects.forEach(function(select) {

		// Lookup the model to be selected from in spec.joins.
		// If no joinId, assume spec.joins[0] (the FROM table).

		var join = _.findWhere(spec.joins, { id: select.joinId }) || spec.joins[0];
		var selection = join.model[select.field];
		var distinct = sql.functionCallCreator('DISTINCT');

		// If select.field doesn't exist in join.model, the user
		// is probably (incorrectly) referring to a field by its
		// actual name rather than its alias. Let's handle that.
		// NOTE: could be source of errors downroad. Revisit.

		if (!selection) {
			var columns = that.definitions[join.table].columns;
			var column  = _.findWhere(columns, { name: select.field });
			selection   = join.model[column.property];
		}

		if (!selection) { throw Error('Column "' + select.field + '" not defined in "' + join.table + '".'); }

		query.select(selection);
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
