
var _ 				 = require('underscore');
var Collection = require('./Collection');


function Joins(joins, spec) {
	this.collection = joins.map(function(join) {
		return new JoinSpec(join, spec);
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


function JoinSpec(join, spec) {
	if (_.isString(join)) { join = { name: join }; }
	var properties = _.pick(join, ['id', 'name', 'as', 'joinId']);
	_.extend(this, properties);
}


JoinSpec.prototype.toSQL = function(qb, joins, names, source) {
	var that = this;

	// If joins is not yet defined, this is the first "join", i.e.
	// the "FROM" table. Create a FROM clause with optional alias,
	// add that alias to the "names" array and return.

	if (!joins) {
		var alias  = this.as || qb.definitions[this.name].as;
		this.model = qb.models[this.name].as(alias);
		names.push({ alias: alias || this.name, used: 1 });
		return this.model;
	}

	// The "source" table is the table being joined ON. If not specified, this 
	// always defaults to the first join in spec.joins (the FROM table).

	var sourceJoin = source || qb.spec.joins.findWhere({ id: this.joinId }) || qb.spec.joins.first();
	var sourceDef  = qb.definitions[sourceJoin.name];

	if (!sourceDef.joins[this.name]) { 
		throw Error('Table "' + this.name + '" has no defined join on "' + sourceDef.name + '".');
	}

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


module.exports.Joins    = Joins;
module.exports.JoinSpec = JoinSpec;
