 
var sql = require('sql');
var _   = require('underscore');


 // Query Builder
// ================================================================
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

require('./define')(Qb, sql);
require('./register-functions')(Qb, sql);
require('./query.js')(Qb, sql);

module.exports = Qb;