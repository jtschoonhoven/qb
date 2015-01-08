
var _ = require('underscore');


// Define Models & Relationships
// ================================================================
// This is done only once when constructing a new qb instance.

module.exports = function(Qb, sql) {

	Qb.prototype.define = function(definitions) {

		// Normalize and apply defaults.
		definitions = normalize.call(this, definitions);

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

		buildSchema.call(this, definitions);
	};
};



// Normalize
// ================================================================
// For convenience QB is flexible about how users define models.
// Columns, for example, may be given as a nested object, an array
// of strings, or a an array of objects. Internally though it's 
// better to be consistent. Thus "normalize".


function normalize(definitions) {
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



// Build Schema
// ================================================================
// Create a map of the database (schema) that shows defined
// tables in the DB and how to join them. Qb.schema is
// meant to be exported for use by a service or end user.
// Tables and columns marked "hidden" are omitted and schema
// uses arrays where definitions uses objects.

function buildSchema(definitions) {
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
}