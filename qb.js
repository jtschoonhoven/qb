
var sql = require('sql');
var _   = require('underscore');



// =============
// Query builder
// =============



// Create the root constructor function.
// The models object contains models defined by the sql package.
// The schema object is a map of the db structure.
// The definitions object is a copy of user-defined definitions.
// Functions are cloned from node-sql, avoids writing to prototype.

function Qb(definitions, dialect) {
	this.models = {};
	this.schema = [];
	this.definitions = {};
	this.functions = _.clone(sql.functions);

	if (dialect) { sql.setDialect(dialect); }
	if (definitions) { this.define(definitions); }
}


// Extend SQL's functionCallCreator so that SQL functions may
// be defined with arguments prefilled. This function is used
// internally to register functions and is also exposed to
// the user so that they can register their own. "ID" is the
// reference key for the function, "name" is how it appears in
// the SQL statement.

Qb.prototype.registerFunction = function(id, name) {
	var func = sql.functionCallCreator(name || id);
	var args = _.toArray(arguments).splice(2);

	if (!_.isEmpty(args)) {
		args = args.map(function(arg) { return !arg && arg !== 0 ? _ : arg; });
		args = [func].concat(args);
		func = _.partial.apply(this, args);
	}

	return this.functions[id || name] = func;
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
			return { name: col.name, property: col.property };
		});

		// Register the model with sql.define.
		var sqlDef = { name: tableName, columns: sqlColumns };
		this.models[tableName] = sql.define(sqlDef);
	}

	this.buildSchema(definitions);
};



// Users may define columns and joins in a few different
// formats. Standardize formats and apply defaults.

Qb.prototype.normalize = function(definitions) {
	for (var tableName in definitions) {
		var tableDef = definitions[tableName];
		var columns  = {};
		var joins    = {};

		tableDef.name = tableName;
		tableDef.as   = tableDef.as;

		// Columns may be defined as an object of strings/objects 
		// or as an array of strings/objects. These if/else blocks 
		// normalize to nested object.

		if (_.isArray(tableDef.columns)) {
			tableDef.columns.forEach(function(col) {

				if (_.isString(col)) {
					columns[col] = { name: col, property: undefined, hidden: undefined }; 
				} 

				else if (_.isObject(col)) {
					if (col.primary_key) { tableDef.primary_key = col.name; }
					columns[col.name] =  { name: col.name, property: col.property, hidden: col.hidden };
				}
			});
		}	

		else if (_.isObject(tableDef.columns)) {
			for (var colName in tableDef.columns) {
				var col = tableDef.columns[colName];

				if (!col || _.isString(col)) {
					columns[colName] = { name: colName, property: col || undefined, hidden: undefined };
				}

				else if (_.isObject(col)) {
					if (col.primary_key) { tableDef.primary_key = colName; }
					columns[colName] = { name: colName, property: col.property, hidden: col.hidden };
				}
			}
		}

		tableDef.columns = columns;

		// Joins may be defined as an array of objects or as a flat or
		// nested object. Normalize to nested object.

		if (_.isArray(tableDef.joins)) {
			tableDef.joins.forEach(function(join) {
				if (!definitions[join.name]) { throw Error('Table ' + tableName + ' joined on undefined table ' + join.name + '.'); }
				var sourceKey = join.source_key || tableDef.primary_key || 'id';
				var targetKey = join.target_key || definitions[join.name].primary_key || 'id';
				joins[join.name] = { name: join.name, alias: join.alias, source_key: sourceKey, target_key: targetKey };
			});
		}

		else if (_.isObject(tableDef.joins)) {
			for (var joinName in tableDef.joins) {
				var join = tableDef.joins[joinName];

				if (!definitions[joinName]) { throw Error('Table ' + tableName + ' joined on undefined table ' + joinName + '.'); }

				// Source/target keys default to primary_key if exists, else "id".
				var sourceKey = join.source_key || tableDef.primary_key || 'id';
				var targetKey = join.target_key || definitions[joinName].primary_key || 'id';

				joins[joinName] = { name: joinName, alias: join.alias, source_key: sourceKey, target_key: targetKey };
			}
		}

		tableDef.joins = joins;
		this.definitions[tableName] = tableDef;
	}

	return definitions;
};



// Create a map of the database (schema) that shows defined
// tables in the DB and how to join them. Qb.schema is
// meant to be exported for user by a service or end user.

// Note: right now, schema is essentially a copy of
// definitions that uses arrays. This is because my own use
// case is for this to work with Backbone, though I'm unsure
// if that is the best solution in general.

Qb.prototype.buildSchema = function(definitions) {
	var publicDefinitions = _.omit(definitions, function(def) { return def.hidden; });

	// For each nonhidden table, push each nonhidden column
	// and nonhidden join to schema array. 

	for (var tableName in publicDefinitions) {
		var tableDef = definitions[tableName];

		// Convert joins and columns to arrays. Omit columns
		// marked "hidden" or joins onto hidden tables.

		var colArray   = _.toArray(tableDef.columns);
		var publicCols = _.reject(colArray, { hidden: true });

		var joinArray   = _.toArray(tableDef.joins);
		var publicJoins = joinArray.filter(function(join) {
			return !definitions[join.name].hidden;
		});

		var tableSchema = {
			name: tableDef.name,
			alias: tableDef.property,
			columns: publicCols,
			joins: publicJoins
		};
		
		this.schema.push(tableSchema);
	}
};



// Assemble query to spec. Returns a string of SQL.
Qb.prototype.query = function(spec) {
	var that = this;

	querySetup.call(this, spec);
	var from  = spec.joins[0].name;
	var query = this.models[from].select([]);

	join.call(this, query, spec);
	select.call(this, query, spec);
	// where.call(this, query, spec);
	// group.call(this, query, spec);

	this.lastQuery           = query.toQuery();
	this.lastQuery.string    = query.toString();
	this.lastQuery.formatted = formatSQL(this.lastQuery.string);

	// console.log('\n');
	// console.log(this.lastQuery.formatted);

	return this.lastQuery;
};



// QuerySetup performs the same role as "normalize" does
// above. Format query spec as a nested object, filter
// keys to whitelist, and fill in default values.

function querySetup(spec) {
	var that = this;

	if (!spec) { throw Error('"Query" called without parameters.'); }

	// Allow user to use some alternate keywords in query spec.
	var selects = spec.selects = spec.selects || spec.select || spec.fields   || [];
	var joins   = spec.joins   = spec.joins   || spec.join   || spec.include  || [];
	var wheres  = spec.wheres  = spec.wheres  || spec.where  || spec.filters  || [];
	var groups  = spec.groups  = spec.groups  || spec.group  || spec.groupBy  || [];

	// Prepend spec.from to the joins array if exists.
	if (spec.from) { spec.joins.unshift({ name: spec.from }); }

	// Let joins and selects be given as a single string.
	if (_.isString(selects)) { selects = [{ name: selects }]; }
	if (_.isString(joins))   { joins   = [{ name: joins }]; }

	spec.selects = selects.map(function(el) {
		var whitelist = ['functions', 'args', 'name', 'joinId'];
		if (_.isString(el)) { return { name: el }; }
		if (_.isString(el.functions)) { el.functions = [el.functions]; }
		if (_.isString(el.args)) { el.args = [el.args] }
		return _.pick(el, whitelist);
	});

	spec.joins = joins.map(function(el) {
		var whitelist = ['id', 'name', 'as', 'joinId'];
		if (_.isString(el)) { return { name: el }; }
		return _.pick(el, whitelist); 
	});

	// Remove any nonwhitelisted keys from spec.
	var whitelist = ['selects', 'joins', 'wheres', 'groups'];
	Object.keys(spec).forEach(function(key) {
		if (!_.contains(whitelist, key)) { delete spec[key] }
	});
}



// Join each table in spec.joins array.
function join(query, spec) {
	var that = this;

	// For each join in spec.joins, append a JOIN clause to
	// the "joins" model. Keep track of each alias and number
	// of times used in "names" array (avoids reusing alias).

	var from  = spec.joins[0];
	var name  = from.name;
	var def   = this.definitions[name];
	var alias = from.as || def.as;
	var joins = this.models[name].as(alias);
	var names = [{ alias: alias || name, used: 1 }];

	// Save model of FROM table to spec.joins.
	spec.joins[0].model = joins;

	// Note that i=1, rather than i=0, correctly skips the
	// first element in spec.joins (which was joined above).

	for (var i=1; i<spec.joins.length; i++) {
		var thisJoin = spec.joins[i];
		joins = joinOnce.call(that, spec, thisJoin, joins, names);
	}

	query.from(joins);
}



// A single join operation. Called for each join in spec.joins.
function joinOnce(spec, join, joins, names) {

	// The "source" table is the table being joined ON. If not specified, this 
	// always defaults to the first join in spec.joins (the FROM table). 

	var sourceJoin = _.findWhere(spec.joins, { id: join.joinId }) || spec.joins[0];
	var sourceDef  = this.definitions[sourceJoin.name];

	// Intermediate tables are joined through implicitly according
	// to the "via" attribute in definitions. Intermediates sit
	// in between a join table and its defined source.

	var intermediate = sourceDef.joins[join.name].via;

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

	var joinName = join.name;
	var joinDef   = this.definitions[joinName];

	// But before naming the new model, we need to grab its alias
	// and check whether it already exists in "names", the array
	// of aliases that have already been used.

	var joinAlias = join.as || joinDef.as;
	var named = _.findWhere(names, { alias: joinAlias || joinName });

	// If joinAlias has already been used, make a new alias by
	// appending an index to the old alias e.g. users_2.
	// Otherwise add joinAlias to names array.

	if (named) { 
		joinAlias = named.alias + '_' + (++named.used);
	} else {
		names.push({ alias: joinAlias || joinName, used: 1 });
	}

	join.model = this.models[joinName].as(joinAlias);

	// Get keys for join. Default to primary key if source/target keys are not set.
	var sourceKey = sourceDef.joins[joinName].source_key || sourceDef.primary_key;
	var joinKey   = sourceDef.joins[joinName].target_key || joinDef.primary_key;

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
		var selection = join.model[select.name];
		if (!selection) { throw Error('Column "' + select.name + '" not defined in "' + join.name + '".'); }

		select.functions = select.functions || [];
		select.functions.reverse().forEach(function(func) {

			// Cast func and args if given as string.
			if (_.isString(func))      { func = { name: func };   }
			if (_.isString(func.args)) { func.args = [func.args]; }

			func.args = func.args || [];
			func.name = func.name.toUpperCase();

			// Lookup from qb.functions if exists, else register new.
			var funcDef = that.functions[func.name];
			if (!funcDef) { funcDef = that.registerFunction(func.name); }

			// Prefill arguments to funcDef if exists.
			if (!_.isEmpty(func.args)) {
				var args = func.args.map(function(arg) { return !arg && arg !== 0 ? _ : arg; });
				args     = [funcDef].concat(args);
				funcDef  = _.partial.apply(this, args);
			}

			selection = funcDef(selection);
		});

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
