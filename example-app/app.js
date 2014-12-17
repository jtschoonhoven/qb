
// NOTE: App.js must be bundled with Browserify and
// Jadeify before use. Use the gulp bundle or gulp watch
// commands to generate bundle.js.

(function() {


	var Table = Backbone.Model.extend({
		defaults: { id: null, name: null, columns: [], joins: [] }
	});



	// DB Schema
	// ==================================================

	var Schema = Backbone.Collection.extend({
		model: Table
	});

	Schema.prototype.bootstrap = function(definitions) {
		for (var tableName in definitions) {
			var table = new Table({
				id: tableName,
				name: definitions[tableName].name,
				joins: definitions[tableName].joins,
				columns: definitions[tableName].columns
			});
			this.add(table);
		}
	};



	// Query Model
	// ==================================================
	// Child model. A query is composed of many nested 
	// Spec models.

	var Spec = Backbone.Model.extend({
		defaults: { table: null, fields: [], filters: [], joins: [] }
	});



	// Query Model
	// ==================================================
	// The top level model of the app. Contains nested
	// child Specs.

	var Query = Spec.extend({
		url: '/api/build'
	});



	// Form View
	// ==================================================
	// The top level view of the app. A form is composed
	// of many nested fieldsets.

	var Form = Backbone.View.extend({
		template: require('./templates/form.jade'),
		fieldsets: []
	});

	Form.prototype.initialize = function() {
		this.render();
	};

	Form.prototype.render = function() {
		this.$el.html(this.template());

		var fieldset = new Fieldset({ 
			parent: this, 
			className: 'fieldset container-fluid col-sm-12',
			collection: schema
		});

		this.fieldsets.push(fieldset);
	};



	// Fieldset View
	// ==================================================
	// A fieldset contains input groups used to build the
	// query. A fieldset may contain chid fieldsets.

	var Fieldset = Backbone.View.extend({
		template: require('./templates/fieldset.jade'),
		className: 'fieldset container-fluid col-sm-11 col-sm-offset-1',
		fieldsets: [],
		events: { 'change .select-model select': 'selectModel' }
	});

	Fieldset.prototype.initialize = function(params) {
		this.parent = params.parent;
		this.render();
	};

	Fieldset.prototype.render = function() {
		this.$el.html(this.template({ schema: this.collection.toJSON() }));
		this.$el.appendTo(this.parent.$el.find('.fieldsets').first());
	};

	Fieldset.prototype.selectModel = function() {
		console.log('OKOKOK')
	};


	// Start App
	// ==================================================

	// Get schema. Normally this would be returned by a 
	// GET request to /api/schema, but this avoid the
	// Node dependency.

	var definitions = require('../example-definitions');
	var schema = new Schema();
	schema.bootstrap(definitions);
	console.log(schema.toJSON())

	new Form({ el: '#app-goes-here' });

})()