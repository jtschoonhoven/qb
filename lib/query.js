
var _         = require('underscore');
var Selects   = require('./select').Selects;
var Joins     = require('./join').Joins;
var Wheres    = require('./where').Wheres;
var WhereSpec = require('./where').WhereSpec;
var GroupBys  = require('./group-by').GroupBys;
var OrderBys  = require('./order-by').OrderBys;
var Limit     = require('./limit').Limit;


// Create Query
// ================================================================
// Here we put the "Query" in "Query Builder". Add a method that
// accepts a "spec" object that defines a query. 

module.exports = function(Qb, sql) {

	Qb.prototype.query = function(spec) {
		var that  = this;

		this.spec = new QuerySpec(spec, this.definitions);
		var from  = this.spec.joins.first().name;

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

};



// Query Spec Constructor
// ================================================================
// The query spec is the obect passed to qb.query. It then gets
// passed to this constructor which returns an object of
// normalized parameters.

function QuerySpec(spec, definitions) {
	var that = this;

	if (!_.isObject(spec)) {
		throw Error('No query specifications were given.');
	}

	// Specs may be named in plural or singular form.
	this.joins    = spec.joins    || spec.join    || [];
	this.selects  = spec.selects  || spec.select  || [];
	this.wheres   = spec.wheres   || spec.where   || [];
	this.groupBys = spec.groupBys || spec.groupBy || [];
	this.orderBys = spec.orderBys || spec.orderBy || [];
	this.limit    = spec.limit    || spec.limitTo;

	// Force specs to array.
	if (!_.isArray(this.joins))    { this.joins    = [this.joins]; }
	if (!_.isArray(this.selects))  { this.selects  = [this.selects]; }
	if (!_.isArray(this.wheres))   { this.wheres   = [this.wheres]; }
	if (!_.isArray(this.groupBys)) { this.groupBys = [this.groupBys]; }
	if (!_.isArray(this.orderBys)) { this.orderBys = [this.orderBys]; }

	// Syntactic sugar allows first join to have special key "from".
	if (spec.from) { this.joins.unshift(spec.from); }

	if (_.isEmpty(this.joins)) {
		throw Error('No FROM table was specified.');
	}

	// If ORDER or GROUP BYs were declared in selects move to own spec.
	_.each(this.selects, function(select) {
		if (select.groupBy) {
			that.groupBys.push(_.clone(select));
			delete select.groupBy;
		}

		if (select.orderBy) {
			that.orderBys.push(_.clone(select));
			delete select.orderBy;
		}
	});

	// Transform selects & joins into collections with a toSQL method.
	this.selects  = new Selects(this.selects, this);
	this.joins    = new Joins(this.joins, this);
	this.wheres   = new Wheres(this.wheres, this);
	this.groupBys = new GroupBys(this.groupBys, this);
	this.orderBys = new OrderBys(this.orderBys, this);
	this.limit    = new Limit(this.limit, this);

	// Users can also filter tables from qb.definitions.
	// If any of those filters apply, add them to this.wheres.

	this.joins.each(function(join) {
		var joinDef = definitions[join.name];

		// If a WHERE clause is defined on a joined table...
		if (joinDef.wheres) {
			joinDef.wheres = joinDef.wheres.map(function(where) {

				// Normalize by creating a new whereSpec for each filter.
				var whereSpec = new WhereSpec(where, that);

				// Apply the joinId to the spec if exists, else use "on".
				// JoinId is better because it still works if a table is
				// joined on itself, but the syntax is more cumbersome.

				if (join.id) { whereSpec.field.joinId = join.id; }
				else { whereSpec.field.on = join.name; }

				return whereSpec;
			});
		}

		that.wheres.collection = that.wheres.collection.concat(joinDef.wheres || []);
	});
}


QuerySpec.prototype.toSQL = function(query, qb) {
	this.joins.toSQL(query, qb);
	this.selects.toSQL(query, qb);
	this.wheres.toSQL(query, qb);
	this.groupBys.toSQL(query, qb);
	this.orderBys.toSQL(query, qb);
	this.limit.toSQL(query, qb);
};



// Format SQL
// ================================================================

function formatSQL(sql) {
	var search  = /\bFROM|\bINNER JOIN|\bLEFT JOIN|\bRIGHT JOIN|\bOUTER JOIN|\bON|\bWHERE|\bAND|GROUP BY|ORDER BY|\bLIMIT/g;
	var replace = '\n$&';
	return sql.replace(search, replace);
}
