
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
		url: '/api/schema',
		model: Table
	});



	// Query Model
	// ==================================================
	// Child model. A query is composed of many nested 
	// Spec models.

	var Spec = Backbone.Model.extend({
		defaults: { table: null, fields: [], filters: [], joins: [], groupBys: [] }
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
		this.$el.html(this.template({ 
			schema: this.collection, 
			model: this.model ? this.model : null
		}));
		this.$el.appendTo(this.parent.$el.find('.fieldsets').first());
	};

	Fieldset.prototype.selectModel = function() {
		var tableName = this.$el.find('.select-model select').first().val();
		this.model = schema.get(tableName);
		this.render();
	};


	// Start App
	// ==================================================

	// Get schema. Normally this would be returned by a 
	// GET request to /api/schema, but this avoid the
	// Node dependency.

	var schema = new Schema();
	schema.on('sync', function() {
		console.log(schema.toJSON());
		new Form({ el: '#app-goes-here' });
	});
	schema.fetch();

})()