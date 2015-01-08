
var _ 				 = require('underscore');
var Collection = require('./Collection');
var SelectSpec = require('./select').SelectSpec;


function Wheres(wheres, spec) {
	if (!_.isArray(wheres)) { wheres = [wheres]; }
	this.collection = wheres.map(function(where) {
		return new WhereSpec(where, spec);
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


function WhereSpec(where, spec) {
	if (where.field) { this.field = new SelectSpec(where.field, spec); }
	if (where.match) { this.match = new SelectSpec(where.match, spec); }
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
		var ors   = this.or.toSQL(null, qb);
		var first = this.or.first().filter;
		var rest  = this.or.rest().map(function(or) { return or.filter; });
		
		filter = filter ? filter.or(first) : first;
		rest.forEach(function(or) { filter = filter.or(or); });
	}

	this.filter = filter;
	return filter;
};


module.exports.Wheres    = Wheres;
module.exports.WhereSpec = WhereSpec;