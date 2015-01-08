
var _ = require('underscore');

// Collection Class
// ================================================================
// Within a QuerySpec, each component of the query ("select", 
// "join", etc) is stored as a Collection (a la Backbone). The
// collection manages an internal array of specifications (e.g. the 
// "select" collection manages an array of columns). To make that
// easier, Collections are augmented with some underscore methods. 
// The Collection itself is an object, but calling collection.map 
// accesses its internal array.

function Collection(context) {
	var that = context;
	that.length = that.collection.length;

	// Extend with underscore functions.
	var functions = ['first', 'at', 'findWhere', 'each', 'map', 'rest'];
	functions.forEach(function(func) {
		that[func] = function(arg) { 
			return _[func](that.collection, arg); 
		};
	});
}

module.exports = Collection;