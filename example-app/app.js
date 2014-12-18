
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
		fieldsets: [],
		events: { 'submit form': 'build' }
	});

	Form.prototype.initialize = function() {
		this.render();
	};

	Form.prototype.render = function() {
		this.$el.html(this.template());

		var fieldset = new Fieldset({ 
			parent: this, 
			className: 'fieldset container-fluid col-sm-12',
			collection: this.collection,
			isRoot: true
		});

		this.fieldsets.push(fieldset);
	};

	Form.prototype.build = function(e) {
		e.preventDefault();
		console.log('ok');
	};



	// Fieldset View
	// ==================================================
	// A fieldset contains input groups used to build the
	// query. A fieldset may contain child fieldsets.

	var Fieldset = Backbone.View.extend({
		template: require('./templates/fieldset.jade'),
		className: 'fieldset container-fluid',
		fieldsets: [],
		events: { 
			'change .select-model select': 'selectModel',
			'click .join-btn': 'joinModel',
			'click .unjoin-btn' : 'unjoinModel'
		}
	});

	Fieldset.prototype.initialize = function(params) {
		this.parent = params.parent;
		this.isRoot = params.isRoot;
		this.$el.appendTo(this.parent.$el.find('.fieldsets').first());
		this.render();
	};

	Fieldset.prototype.render = function() {
		this.removeChildren();
		this.$el.html(this.template({ 
			schema: this.collection,
			model: this.model ? this.model : null,
			isRoot: this.isRoot
		}));
	};

	Fieldset.prototype.selectModel = function(e) {
		e.stopImmediatePropagation();
		var tableName = this.$el.find('.select-model select').first().val();
		this.model = this.collection.findWhere({ name: tableName });
		this.render();
	};

	Fieldset.prototype.joinModel = function(e) {
		e.stopImmediatePropagation();

		// Bootstrap a new "schema" to use as child collection.
		var joins = this.model.get('joins');
		joinTables = joins.map(function(join) {
			join.columns = schema.get(join.id).get('columns');
			join.joins = schema.get(join.id).get('joins');
			return new Table(join);
		});

		// Nest a child fieldset inside current fieldset.
		var child = new Fieldset({
			parent: this,
			collection: new Schema(joinTables)
		});

		this.fieldsets.push(child);
	};

	Fieldset.prototype.unjoinModel = function(e) {
		e.stopImmediatePropagation();
		this.removeChildren().remove();
	};

	// Call remove on all child fieldsets.
	Fieldset.prototype.removeChildren = function() {
    _.each(this.childViews || [], function(child) { 
      child.removeChildren();
      Backbone.View.prototype.remove.call(child);
    });
    return this;
	};


	// Start App
	// ==================================================

	// Get schema. Normally this would be returned by a 
	// GET request to /api/schema, but this avoid the
	// Node dependency.

	var schema = new Schema();

	schema.on('sync', function() {
		// schema.bootstrap();
		new Form({ el: '#app-goes-here', collection: schema });
	});
	schema.fetch();

})()