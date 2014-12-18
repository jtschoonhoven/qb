
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



	// Backbone View Prototype
	// ==================================================

	Backbone.View.prototype.removeChildren = function() {
    _.each(this.childViews || [], function(child) { 
      child.removeChildren();
      Backbone.View.prototype.remove.call(child);
    });
    this.childViews = [];
    return this;
	};



	// Form View
	// ==================================================
	// The top level view of the app. A form is composed
	// of many nested fieldsets.

	var Form = Backbone.View.extend({
		template: require('./templates/form.jade'),
		childViews: [],
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

		this.childViews.push(fieldset);
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
		childViews: [],
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
			collection: this.collection,
			model: this.model,
			isRoot: this.isRoot
		}));
	};

	Fieldset.prototype.selectModel = function(e) {
		e.stopImmediatePropagation();

		// Remove all child views;
		this.removeChildren();

		// Set this.model.
		var tableName = this.$el.find('.select-model select').first().val();
		this.model = this.parent.collection.findWhere({ name: tableName });

		// Create a schema from model joins.
		var joins = this.model.get('joins');
		joinTables = joins.map(function(join) {
			join.columns = schema.get(join.id).get('columns');
			join.joins = schema.get(join.id).get('joins');
			return new Table(join);
		});

		var joinSchema = new Schema(joinTables);
		this.model.set('joins', joinSchema);

		// Add a Select input group to view.
		var select = new Select({ 
			parent: this,
			model: this.model,
			selector: '.selects',
			View: Select,
			isRoot: true
		});
		this.childViews.push(select);

		// Add a GroupBy input group to view.
		var groupBy = new GroupBy({ 
			parent: this,
			model: this.model,
			selector: '.groupBys',
			View: GroupBy,
			isRoot: true
		});
		this.childViews.push(groupBy);

		// Add a Filter input group to view.
		var filter = new Filter({ 
			parent: this,
			model: this.model,
			selector: '.filters',
			View: Filter,
			isRoot: true
		});
		this.childViews.push(filter);
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

		this.childViews.push(child);
	};

	Fieldset.prototype.unjoinModel = function(e) {
		e.stopImmediatePropagation();
		this.removeChildren().remove();
	};


	// Input Group Views
	// ==================================================

	var InputGroup = Backbone.View.extend({
		events: { 
			'click .add-btn': 'addInput',
			'click .remove-btn': 'remove'
		}
	});

	InputGroup.prototype.initialize = function(params) {
		this.parent = params.parent;
		this.selector = params.selector;
		this.View = params.View;
		this.childViews = [];
		this.isRoot = params.isRoot;
		this.$el.appendTo(this.parent.$el.find(this.selector)).first();
		this.render();
	};

	InputGroup.prototype.render = function() {
		this.$el.html(this.template({ 
			model: this.model, 
			isRoot: this.isRoot 
		}));
	};

	InputGroup.prototype.addInput = function() {
		var newInput = new this.View({
			View: this.View,
			model: this.model,
			parent: this.parent,
			selector: this.selector
		});

		// Add new view to parent.childViews.
		var siblings = this.parent.get('childViews');
		siblings.push(newInput);
		this.parent.set('childViews', siblings);
	};

	var Select = InputGroup.extend({
		template: require('./templates/select.jade')
	});

	var GroupBy = InputGroup.extend({
		template: require('./templates/groupBy.jade')
	});

	var Filter = InputGroup.extend({
		template: require('./templates/filter.jade')
	});


	// Start App
	// ==================================================

	// Get schema. Normally this would be returned by a 
	// GET request to /api/schema, but this avoid the
	// Node dependency.

	var schema = new Schema();

	schema.on('sync', function() {
		new Form({ el: '#app-goes-here', collection: schema });
	});
	schema.fetch();

})()