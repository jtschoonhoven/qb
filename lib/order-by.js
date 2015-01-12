
var _ 				 = require('underscore');
var Collection = require('./Collection');
var SelectSpec = require('./select').SelectSpec;


function OrderBys(orderBys, spec) {
	this.collection = orderBys.map(function(orderBy) {
		return new OrderBySpec(orderBy, spec);
	});
	_.extend(this, new Collection(this));
}


OrderBys.prototype.toSQL = function(query, qb) {
	this.map(function(orderBy) {
		var order = orderBy.toSQL(qb);
		var direction = orderBy.selection.orderBy;
		if (direction === 'desc' || direction === 'DESC') {
			query.order(order.desc);
		}
		else { query.order(order); }
	});
};


function OrderBySpec(orderBy, spec) {
	this.selection = new SelectSpec(orderBy, spec);
}


OrderBySpec.prototype.toSQL = function(qb) {
	return this.selection.toSQL(qb, 'ignoreAlias');
};


module.exports.OrderBys    = OrderBys;
module.exports.OrderBySpec = OrderBySpec;