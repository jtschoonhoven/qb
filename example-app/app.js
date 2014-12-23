
// NOTE: App.js must be bundled with Browserify and
// Jadeify before use. Use the gulp bundle or gulp watch
// commands to generate bundle.js.

(function() {

	// =========================
	// Query Builder Example App
	// =========================

	// Models
	// ==================================================

	var Table = Backbone.Model.extend({});
	var Join = Backbone.Model.extend({});
	var Select = Backbone.Model.extend({});
	var Filter = Backbone.Model.extend({});
	var Group = Backbone.Model.extend({});

	// Collections
	// ==================================================

	// A map of defined tables, fetched from server.
	var Tables = Backbone.Collection.extend({
		url: '/api/schema',
		model: Table
	});

	var Joins = Backbone.Collection.extend({});
	var Selects = Backbone.Collection.extend({});
	var Filters = Backbone.Collection.extend({});
	var Groups = Backbone.Collection.extend({});

	// Views
	// ==================================================

	Backbone.View.prototype.initialize = function(params) {
		_.extend(this, params);
		this.render();
	};

	Backbone.View.prototype.render = function() {
		this.$el.html(this.template(this));
	};

	// Top level view.
	var QueryBuilder = Backbone.View.extend({
		el: '#app-goes-here',
		template: require('./templates/query-builder.jade')
	});

	var Fieldset = Backbone.View.extend({});
	var JoinView = Backbone.View.extend({});
	var SelectView = Backbone.View.extend({});
	var FilterView = Backbone.View.extend({});
	var GroupView = Backbone.View.extend({});

	// Start app
	// ==================================================

	window.qb = new QueryBuilder();
	window.tables = new Tables();

	tables.on('sync', function() { qb.render(); });
	tables.fetch();

})()