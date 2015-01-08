
var _   = require('underscore');


// Register Custom Functions
// ================================================================
// Extend SQL's functionCallCreator so that SQL functions may
// be defined with arguments prefilled. This function is used
// internally to register functions and is also exposed to
// the user so that they can register their own. "ID" is the
// reference key for the function, "name" is how it appears in
// the SQL statement.

module.exports = function(Qb, sql) {

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

};