
var _ = require('underscore');

// The LIMIT clause is much less complicated than the
// others and really doesn't benefit from all this class
// inheritance stuff, but it's formatted this way for
// consistency.

function Limit(limit, spec) {
	this.limit = parseInt(limit);
};

Limit.prototype.toSQL = function(query, qb) {
	if (_.isFinite(this.limit)) { query.limit(this.limit); }
};

module.exports.Limit = Limit;