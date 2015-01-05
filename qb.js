
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

	this.functions[id || name] = func;
	return func;
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
			return { name: col.name };
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
					columns[col] = { name: col, as: undefined, hidden: undefined }; 
				} 

				else if (_.isObject(col)) {
					if (col.primary_key) { tableDef.primary_key = col.name; }
					columns[col.name] =  { name: col.name, as: col.as, hidden: col.hidden };
				}
			});
		}	

		else if (_.isObject(tableDef.columns)) {
			for (var colName in tableDef.columns) {
				var col = tableDef.columns[colName];

				if (!col || _.isString(col)) {
					columns[colName] = { name: colName, as: col || undefined, hidden: undefined };
				}

				else if (_.isObject(col)) {
					if (col.primary_key) { tableDef.primary_key = colName; }
					columns[colName] = { name: colName, as: col.as, hidden: col.hidden };
				}
			}
		}

		tableDef.columns = columns;

		// Joins may be defined as an array of objects or as a flat or
		// nested object. Normalize to nested object.

		if (_.isArray(tableDef.joins)) {
			tableDef.joins.forEach(function(join) {

				if (!definitions[join.name]) { 
					throw Error('Table ' + tableName + ' joined on undefined table ' + join.name + '.'); 
				}

				// Source/target keys default to primary_key if exists, else "id".
				var sourceKey = join.source_key || tableDef.primary_key || 'id';
				var targetKey = join.target_key || definitions[join.name].primary_key || 'id';

				joins[join.name] = { name: join.name, as: join.as, source_key: sourceKey, target_key: targetKey, via: join.via };
			});
		}

		else if (_.isObject(tableDef.joins)) {
			for (var joinName in tableDef.joins) {
				var join = tableDef.joins[joinName];

				if (!definitions[joinName]) { 
					throw Error('Table ' + tableName + ' joined on undefined table ' + joinName + '.'); 
				}

				var sourceKey = join.source_key || tableDef.primary_key || 'id';
				var targetKey = join.target_key || definitions[joinName].primary_key || 'id';

				joins[joinName] = { name: joinName, as: join.as, source_key: sourceKey, target_key: targetKey, via: join.via };
			}
		}

		tableDef.joins = joins;
		this.definitions[tableName] = tableDef;
	}

	return definitions;
};



// Create a map of the database (schema) that shows defined
// tables in the DB and how to join them. Qb.schema is
// meant to be exported for use by a service or end user.
// Tables and columns marked "hidden" are omitted and schema
// uses arrays where definitions uses objects.

// **This should be a function called by QB, hidden by scope**
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
			name    : tableDef.name,
			as      : tableDef.as,
			columns : publicCols,
			joins   : publicJoins
		};
		
		this.schema.push(tableSchema);
	}
};



// Assemble query to spec. Returns a string of SQL.
Qb.prototype.query = function(spec) {
	var that = this;
	this.spec = new QuerySpec(spec);

	var from = this.spec.joins.first().name;

	if (!this.models[from]) {
		throw Error('Table "' + from + '" is not defined.');
	}

	var query = this.models[from].select([]);
	this.spec.toSQL(query, this);

	this.lastQuery           = query.toQuery();
	this.lastQuery.string    = query.toString();
	this.lastQuery.formatted = formatSQL(this.lastQuery.string);

	return this.lastQuery;
};


function QuerySpec(spec) {
	if (!_.isObject(spec)) {
		throw Error('No query specifications were given.')
	}

	// Specs may be named in plural or singular form.
	var joins   = spec.joins   || spec.join   || [];
	var selects = spec.selects || spec.select || [];
	var wheres  = spec.wheres  || spec.where  || [];

	// Force specs to array.
	if (!_.isArray(joins))   { joins   = [joins]; }
	if (!_.isArray(selects)) { selects = [selects]; }
	if (!_.isArray(wheres))  { wheres  = [wheres]; }

	// Syntactic sugar allows first join to have special key "from".
	if (spec.from) { joins.unshift(spec.from); }

	if (joins.length === 0) {
		throw Error('No FROM table was specified.');
	}

	this.joins   = new Joins(joins);
	this.selects = new Selects(selects);
	this.wheres  = new Wheres(wheres);
}


QuerySpec.prototype.toSQL = function(query, qb) {
	this.joins.toSQL(query, qb);
	this.selects.toSQL(query, qb);
	this.wheres.toSQL(query, qb);
};


function Collection(context) {
	var that = context;
	that.length = that.collection.length;

	// Extend with underscore functions.
	var functions = ['first', 'at', 'findWhere', 'each', 'map', 'rest'];
	functions.forEach(function(func) {
		that[func] = function(arg) { 
			return _[func](that.collection, arg); 
		};
	});
}


function Joins(joins) {
	this.collection = joins.map(function(join) {
		return new JoinSpec(join);
	});
	_.extend(this, new Collection(this));
}


Joins.prototype.toSQL = function(query, qb) {
	var that  = this;
	var names = [];
	var joins;

	this.each(function(join, index) {
		joins = join.toSQL(qb, joins, names);
	});

	query.from(joins);
};


function JoinSpec(join) {
	if (_.isString(join)) { join = { name: join }; }
	var properties = _.pick(join, ['id', 'name', 'as', 'joinId']);
	_.extend(this, properties);
}


JoinSpec.prototype.toSQL = function(qb, joins, names, source) {
	var that = this;

	if (!joins) {
		var alias  = this.as || qb.definitions[this.name].as;
		this.model = qb.models[this.name].as(alias);
		names      = [{ alias: alias || this.name, used: 1 }];
		return this.model;
	}

	// The "source" table is the table being joined ON. If not specified, this 
	// always defaults to the first join in spec.joins (the FROM table).

	var sourceJoin = source || qb.spec.joins.findWhere({ id: this.joinId }) || qb.spec.joins.first();
	var sourceDef  = qb.definitions[sourceJoin.name];

	// Intermediate tables are joined through implicitly according
	// to the "via" attribute in definitions. Intermediates sit
	// in between a join table and its defined source.

	var intermediate = sourceDef.joins[this.name].via;

	if (intermediate) {
		var viaId = _.uniqueId('_via_');

		var firstJoin = new JoinSpec({ name: intermediate, id: viaId, joinId: this.joinId });
		var thenJoin  = new JoinSpec({ name: this.name, id: this.id, joinId: viaId, as: this.as });

		joins = firstJoin.toSQL(qb, joins, names, sourceJoin);
		joins = thenJoin.toSQL(qb, joins, names, firstJoin);

		this.model = thenJoin.model;

		return joins;
	}

	// The "join" table is the table being joined. Similar to the
	// source attributes above, we need the table name and defs.

	var joinName = this.name;
	var joinDef  = qb.definitions[joinName];

	// But before naming the new model, we need to grab its alias
	// and check whether it already exists in "names", the array
	// of aliases that have already been used.

	var joinAlias = this.as || joinDef.as;
	var named     = _.findWhere(names, { alias: joinAlias || joinName });

	// If joinAlias has already been used, make a new alias by
	// appending an index to the old alias e.g. users_2.
	// Otherwise add joinAlias to names array.

	if (named) { 
		joinAlias = named.alias + '_' + (++named.used);
	} else {
		names.push({ alias: joinAlias || joinName, used: 1 });
	}

	this.model = qb.models[joinName].as(joinAlias);

	// Get keys for join. Default to primary key if source/target keys are not set.
	var sourceKey = sourceDef.joins[joinName].source_key || sourceDef.primary_key;
	var joinKey   = sourceDef.joins[joinName].target_key || joinDef.primary_key;

	// Add a JOIN clause and return joins.
	return joins.join(this.model).on(sourceJoin.model[sourceKey].equals(this.model[joinKey]));
};


function Selects(selects) {
	this.collection = selects.map(function(select) {
		return new SelectSpec(select);
	});
	_.extend(this, new Collection(this));
}


Selects.prototype.toSQL = function(query, qb) {
	this.each(function(select) {
		var selection = select.toSQL(qb);
		query.select(selection);
	});
};


function SelectSpec(select) {
	if (_.isString(select)) { select = { name: select }; }
	if (_.isString(select.functions)) { select.functions = [select.functions]; }
	if (_.isString(select.args)) { select.args = [select.args]; }
	var properties = _.pick(select, ['functions', 'args', 'name', 'joinId', 'as', 'value']);
	_.extend(this, properties);
}



SelectSpec.prototype.toSQL = function(qb, ignoreAlias) {
	var that = this;

	// Lookup the model to be selected from in spec.joins.
	// If no joinId, assume spec.joins[0] (the FROM table).

	var join = qb.spec.joins.findWhere({ id: this.joinId }) || qb.spec.joins.first();
	var def  = qb.definitions[join.name].columns[this.name];

	if (!def && !this.value) { 
		throw Error('Column "' + this.name + '" not defined in "' + join.name + '".'); 
	}

	if (def) {
		var alias     = def.as;
		var selection = join.model[def.name];
	}

	else if (_.isFinite(this.value)) { 
		var selection = join.model.literal(this.value);
	}

	else if (_.isString(this.value)) {
		var escaped   = '\'' + this.value + '\'';
		var selection = join.model.literal(escaped);
	} 

	if (!selection) { 
		throw Error('Column "' + def.name + '" not defined in "' + join.name + '".'); 
	}

	this.functions = this.functions || [];
	this.functions.reverse().forEach(function(func) {

		// Cast func and args if given as string.
		if (_.isString(func))      { func = { name: func };   }
		if (_.isString(func.args)) { func.args = [func.args]; }

		func.name = func.name.toUpperCase();
		func.args = func.args || [];

		// Lookup from qb.functions if exists, else register new.
		var funcDef = qb.functions[func.name];
		if (!funcDef) { funcDef = qb.registerFunction(func.name); }

		// Prefill arguments to funcDef if exists.
		if (!_.isEmpty(func.args)) {
			var args = func.args.map(function(arg) { return !arg && arg !== 0 ? _ : arg; });
			args     = [funcDef].concat(args);
			funcDef  = _.partial.apply(this, args);
		}

		// Append function name as a suffix to "AS".
		alias = (alias || that.name || 'col') + '_' + func.name.toLowerCase();
		selection = funcDef(selection);
	});

	// Use alias defined in SELECT even if one was generated above.
	// If generating a WHERE clause, ignoreAlias will be true.

	alias = this.as || alias;
	if (alias && !ignoreAlias) { selection = selection.as(alias); }

	this.selection = selection;
	return selection;
};


function Wheres(wheres) {
	if (!_.isArray(wheres)) { wheres = [wheres]; }
	this.collection = wheres.map(function(where) {
		return new WhereSpec(where);
	});
	_.extend(this, new Collection(this));
}


Wheres.prototype.toSQL = function(query, qb) {
	var filters = this.map(function(where) { 
		var filter = where.toSQL(qb);
		if (query) { query.where(filter); }
		return filter;
	});
	return filters;
};


function WhereSpec(where) {
	if (where.field) { this.field = new SelectSpec(where.field); }
	if (where.match) { this.match = new SelectSpec(where.match); }
	if (where.or)    { this.or    = new Wheres(where.or); }
	this.op = where.op || where.operator || 'equals';
}


WhereSpec.prototype.toSQL = function(qb) {
	var filter;

	if (this.field && this.match) {
		var field  = this.field.toSQL(qb, 'ignoreAlias');
		var match  = this.match.toSQL(qb, 'ignoreAlias');
		filter = field[this.op](match);
	}

	if (this.or) {
		var ors     = this.or.toSQL(null, qb);
		var first   = this.or.first().filter;
		var rest    = this.or.rest().map(function(or) { return or.filter; });
		
		filter = filter ? filter.or(first) : first;
		rest.forEach(function(or) { filter = filter.or(or); });
	}

	this.filter = filter;
	return filter;
};


// Add linebreaks before keywords.
function formatSQL(sql) {
	var search  = /FROM|INNER JOIN|LEFT JOIN|RIGHT JOIN|OUTER JOIN|ON|WHERE|AND|GROUP BY|ORDER BY|LIMIT/g;
	var replace = '\n$&';
	return sql.replace(search, replace);
}


module.exports = Qb;
