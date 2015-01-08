
var _ 				 = require('underscore');
var Collection = require('./Collection');
var SelectSpec = require('./select').SelectSpec;


function GroupBys(groupBys, spec) {
	this.collection = groupBys.map(function(groupBy) {
		return new GroupBySpec(groupBy, spec);
	});
	_.extend(this, new Collection(this));
}


GroupBys.prototype.toSQL = function(query, qb) {
	var groups = this.map(function(groupBy) {
		return groupBy.toSQL(qb);
	});
	if (!_.isEmpty(groups)) { query.group(groups); }
};


function GroupBySpec(groupBy, spec) {
	this.selection = new SelectSpec(groupBy, spec);
}


GroupBySpec.prototype.toSQL = function(qb) {
	return this.selection.toSQL(qb, 'ignoreAlias');
};


module.exports.GroupBys    = GroupBys;
module.exports.GroupBySpec = GroupBySpec;