
var _ 				 = require('underscore');
var Collection = require('./Collection');


function Selects(selects, spec) {
	this.collection = selects.map(function(select) {
		return new SelectSpec(select, spec);
	});
	_.extend(this, new Collection(this));
}


Selects.prototype.toSQL = function(query, qb) {
	this.each(function(select) {
		var selection = select.toSQL(qb);
		query.select(selection);
	});
};


function SelectSpec(select, spec) {
	// Convert string properties to objects.
	if (_.isString(select)) { select = { name: select }; }
	if (_.isString(select.function)) { select.functions = [select.function]; }
	if (_.isString(select.functions)) { select.functions = [select.functions]; }
	if (_.isString(select.args)) { select.args = [select.args]; }

	// Apply whitelisted properties to instance.
	var properties = _.pick(select, ['functions', 'args', 'name', 'joinId', 'as', 'value', 'orderBy']);
	_.extend(this, properties);
}



SelectSpec.prototype.toSQL = function(qb, ignoreAlias) {
	var that = this;

	// Lookup the model to be selected from in spec.joins.
	// If no joinId, assume spec.joins[0] (the FROM table).

	var join = qb.spec.joins.findWhere({ id: this.joinId }) || qb.spec.joins.first();
	var def  = qb.definitions[join.name].columns[this.name];

	if (!def && _.isUndefined(this.value)) {
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

module.exports.Selects    = Selects;
module.exports.SelectSpec = SelectSpec;