
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
    	if (child.model) { child.model.destroy(); }
      child.removeChildren();
      Backbone.View.prototype.remove.call(child);
    });
    this.childViews = [];
    return this;
	};



	// Form View
	// ==================================================
	// The top level view of the app. A form is composed
	// of many nested joins.

	var Form = Backbone.View.extend({
		template: require('./templates/form.jade'),
		childViews: [],
		joined: new Schema(),
		events: { 'submit form': 'build' }
	});

	Form.prototype.initialize = function() {
		// Make this top level view available to all views.
		Backbone.View.prototype.form = this;
		this.render();
	};

	Form.prototype.render = function() {
		this.$el.html(this.template());

		var join = new Join({ 
			parent: this, 
			collection: schema,
			selector: '.joins',
			isRoot: true
		});
		this.childViews.push(join);

		var select = new Select({ 
			parent: this,
			collection: this.joined,
			selector: '.selects',
			View: Select,
			isRoot: true
		});
		this.childViews.push(select);

		// var groupBy = new GroupBy({ 
		// 	parent: this,
		// 	model: this.model,
		// 	selector: '.groupBys',
		// 	View: GroupBy,
		// 	isRoot: true
		// });
		// this.childViews.push(groupBy);

		// var filter = new Filter({ 
		// 	parent: this,
		// 	model: this.model,
		// 	selector: '.filters',
		// 	View: Filter,
		// 	isRoot: true
		// });
		// this.childViews.push(filter);

	};

	Form.prototype.build = function(e) {
		e.preventDefault();
		console.log('ok');
	};


	// Input Group Views
	// ==================================================

	var InputGroup = Backbone.View.extend({
		events: { 
			'click .add-btn': 'addInput',
			'click .remove-btn': 'removeInput',
			'change .select-model select': 'selectModel'
		}
	});

	InputGroup.prototype.initialize = function(params) {
		this.parent = params.parent;
		this.selector = params.selector;
		this.View = params.View;
		this.childViews = [];
		this.isRoot = params.isRoot;
		this.$el.appendTo(this.parent.$el.find(this.selector)).first();
		this.listenTo(this.form.joined, 'add remove', this.render);
		this.render();
	};

	InputGroup.prototype.render = function() {
		this.$el.html(this.template({
			collection: this.collection,
			model: this.model, 
			isRoot: this.isRoot 
		}));
	};

	InputGroup.prototype.addInput = function() {
		var newInput = new this.View({
			View: this.View,
			model: this.model,
			selector: this.selector
		});

		// Add new view to parent.childViews.
		var siblings = this.parent.get('childViews');
		siblings.push(newInput);
		this.parent.set('childViews', siblings);
	};

	InputGroup.prototype.removeInput = function() {
		this.remove();
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

	var Join = InputGroup.extend({
		template: require('./templates/join.jade')
	});

	// Overwrite default behavior for addInput.
	Join.prototype.addInput = function(e) {
		e.stopImmediatePropagation();
		var join = new Join({
			parent: this,
			selector: '.joins',
			collection: this.model.get('joins')
		});
		this.childViews.push(join);
	};

	// Overwrite default behavior for remove.
	Join.prototype.removeInput = function(e) {
		if (e) { e.stopImmediatePropagation(); }
		this.removeChildren().remove();
	}

	Join.prototype.selectModel = function(e) {
		e.stopImmediatePropagation();
		this.removeChildren();

		// Set this.model.
		var tableName = this.$el.find('.select-model select').first().val();
		this.model = this.collection.findWhere({ name: tableName });

		// Create a schema from model joins.
		var joins = this.model.get('joins');
		joinTables = joins.map(function(join) {
			join.columns = schema.get(join.id).get('columns');
			join.joins = schema.get(join.id).get('joins');
			return new Table(join);
		});

		var joinSchema = new Schema(joinTables);
		this.model.set('joins', joinSchema);
		this.form.joined.add(this.model);
	};


	// Start App
	// ==================================================

	// Get schema. Normally this would be returned by a 
	// GET request to /api/schema, but this avoid the
	// Node dependency.

	var schema = new Schema();

	schema.on('sync', function() {
		new Form({ el: '#app-goes-here' });
	});
	schema.fetch();

})()