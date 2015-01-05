
// NOTE: App.js must be bundled with Browserify and
// Jadeify before use. Use the gulp bundle or gulp watch
// commands to generate bundle.js.

(function() {


	// =========================
	// Query Builder Example App
	// =========================


	// Models
	// ==================================================
	// Each model represents a single SQL clause defined
	// by the user. I.e. each SELECT, JOIN, WHERE, etc.
	// is represented as a model in a Backbone
	// collection. Each model gets a setAttributes
	// function which parses user-defined input into
	// the format required by Query Builder.

	var Join = Backbone.Model.extend();

	Join.prototype.setAttributes = function(input) {
		this.set({
			name   : input[0].value,
			joinId : input[0].joinId,
			as     : input[0].label
		});
	};


	var Select = Backbone.Model.extend();

	Select.prototype.setAttributes = function(input) {
		this.set({
			functions : input[0].value || undefined,
			joinId    : input[1].joinId,
			name      : input[1].value
		});
	};

	Select.prototype.validate = function(attr) {
		// Check that selected field exists in schema.
		var join      = qb.joinSet.collection.get(attr.joinId);
		var joinTable = tables.findWhere({ name: join ? join.get('name') : false });
		var columns   = joinTable ? joinTable.get('columns') : [];
		var selected  = _.findWhere(columns, { name: attr.name });
		if (!selected) { return 'Invalid selection.'; }
	};


	var Where = Backbone.Model.extend();

	Where.prototype.setAttributes = function(input) {
		this.set({ 
			field: { name: input[0].value, joinId: input[0].joinId }, 
			operator: input[1].value || 'equals', 
			match: { value: input[2].value || '' } 
		});
	};

	Where.prototype.validate = function(attr) {
		// Check that field exists in schema.
		var join      = qb.joinSet.collection.get(attr.field.joinId);
		var joinTable = tables.findWhere({ name: join ? join.get('name') : false });
		var columns   = joinTable ? joinTable.get('columns') : [];
		var selected  = _.findWhere(columns, { name: attr.field.name });
		if (!selected) { return 'Invalid filter.'; }
	};


	var Table = Backbone.Model.extend({
		idAttribute: 'name',
		defaults: { name: undefined, as: undefined, columns: [], joins: [] }
	});



	// Collections
	// ==================================================
	// Selects, joins, etc. are all stored in their own
	// collection. The special Tables collection is
	// generated by Query Builder server side and
	// populated locally with a fetch(). It is a map of 
	// the db, primarily used to join tables.

	var Tables = Backbone.Collection.extend({
		model: Table,
		url: '/api/schema'
	});

	var tables = new Tables();

	var Joins   = Backbone.Collection.extend();
	var Selects = Backbone.Collection.extend();
	var Wheres  = Backbone.Collection.extend();



	// Extend Backbone View
	// ==================================================
	// These helper functions will be available to every
	// view in the app.

	// Default init behavior. Listen() is a recyclable
	// function meant to contain event listener setup.
	Backbone.View.prototype.initialize = function(params) {
		_.extend(this, params);
		this.childViews = [];
		this.listen();
	};


	// Make the DB schema available inside all templates.
	Backbone.View.prototype.tables = tables;


	// Default render behavior.
	Backbone.View.prototype.render = function() {
		this.$el.html(this.template(this));
		this.trigger('render');
		return this;
	};


	// Noop to be overwritten with listener declarations.
	Backbone.View.prototype.listen = function() {};


	// Call remove recursively on each childView and
	// remove from parent collection.

	Backbone.View.prototype.removeChildren = function() {
    _.each(this.childViews, function(child) {
      child.removeChildren();
      child.collection.remove(child.model);
      Backbone.View.prototype.remove.call(child);
    });
    this.childViews = [];
    return this;
	};


	// Call render on this and every childView in array.
	Backbone.View.prototype.renderChildren = function() {
    _.each(this.childViews, function(child) {
      child.renderChildren();
      Backbone.View.prototype.render.call(child);
    });
    return this;
	};



	// QueryBuilder View
	// ==================================================
	// QueryBuilder (initialized as qb) is the root view
	// of the app.


	var QueryBuilder = Backbone.View.extend({
		el: '#app-goes-here',
		template: require('./templates/query-builder.jade'),
		alert: require('./templates/browserOnly.jade'),
		events: { 'submit': 'build', 'click .add-filter': 'addFilter' }
	});


	QueryBuilder.prototype.listen = function() {
		var that = this;

		// QueryBuilder attaches an event listener to
		// its own render event.
		this.listenTo(this, 'render', function() {

			// Create and render a JoinSet (a fieldset
			// of JOIN inputs)

			that.joinSet = new JoinSet({ 
				el: '.joins', 
				isRoot: true, 
				collection: new Joins(),
			});
			that.joinSet.render();

			// Construct a SelectSet (fieldset of SELECT
			// inputs) but do not render it yet.

			that.selectSet = new SelectSet({ 
				el: '.selects', 
				isRoot: true, 
				collection: new Selects() 
			});

			// Fieldset of WHERE's, not rendered yet.

			that.whereSet = new WhereSet({ 
				el: '.wheres', 
				isRoot: true,
				collection: new Wheres() 
			});

		});
	};


	// Submit form and fetch SQL from server.
	QueryBuilder.prototype.build = function(e) {
		e.preventDefault();
		var that = this;

		if (!this.result) { this.result = new Result(); }

		// Remove invalide models from collection.
		this.selectSet.collection.each(function(select) {
			var collection = that.selectSet.collection;
			if (!select.isValid()) { collection.remove(select); }
		});

		this.whereSet.collection.each(function(where) {
			var collection = that.whereSet.collection;
			if (!where.isValid()) { collection.remove(where); }
		});

		// Stringify collections for server.
		var data = JSON.stringify({
			joins   : this.joinSet.collection.toJSON(),
			selects : this.selectSet.collection.toJSON(),
			wheres  : this.whereSet.collection.toJSON()
		});

		var req = $.post('/api/build', { data: data });

		// On successful POST.
		req.done(function(res) {
			_.extend(that.result, res);
			that.result.render();
		});

		// Assume request only fails if Node isn't running.
		req.fail(function(err, status) {
			that.result.status = 'browserOnly';
			that.result.render();
		});

		this.result.render();
	};



	QueryBuilder.prototype.addFilter = function(e) {
		this.whereSet.render();
	};


	// Construct QueryBuilder view in global scope.
	window.qb = new QueryBuilder();



	// Result View
	// ==================================================
	// A simple panel for displaying QB results/errors.

	var Result = Backbone.View.extend({
		template: require('./templates/result.jade'),
		el: '#result'
	});



	// Input View Base Class
	// ==================================================
	// Join, select, filter, and group views are all very
	// similar. To keep things nice and DRY, all four
	// inherit their functionality from the generic base
	// class, InputView. A single inputView corresponds
	// to a single SQL clause represented by a single
	// Backbone model.

	var InputView = Backbone.View.extend();


	InputView.prototype.events = {
		'change select, input' : 'selectInput',
		'click .add-btn'       : 'addInput',
		'click .remove-btn'    : 'removeInput'
	};


	// When the joinSet updates, rebuild all models.
	InputView.prototype.listen = function() {
		var that = this;
		this.listenTo(qb.joinSet.collection, 'add remove change', function() {
			that.selectInput();
		});
	};


	InputView.prototype.removeInput = function(e) {
		e.stopImmediatePropagation();
		this.removeChildren().remove();
		this.collection.remove(this.model);

		var parentIsFieldset = this.parent instanceof Fieldset;
		var parentIsEmpty    = this.parent.childViews.length === 1;

		if (parentIsFieldset && parentIsEmpty) {
			return this.parent.removeChildren().remove(); 
		}
	};


	// Add a new input group to the DOM.
	InputView.prototype.addInput = function(e) {
		e.stopImmediatePropagation();

		if (!this.isRoot) {
			var fieldset = new this.ParentView({ 
				el: this.$('.content'),
				collection: this.collection, 
				model: this.model,
				isRoot: true,
			});
			return fieldset.render();
		}

		var siblingView = new this.View({
			ParentView: this.ParentView,
			View: this.View, 
			parent: this, 
			collection: this.collection
		});

		var targetEl = this.parent.$('.content').first();
		siblingView.render().$el.appendTo(targetEl);
		this.parent.childViews.push(siblingView);
	};


	// Create/set this.model from user selections in the DOM.
	InputView.prototype.selectInput = function(e) {
		if (e) { e.stopImmediatePropagation(); }
		var that = this;

		// Grab specified attributes from each input in form.
		var selected = {};
		this.$('select, input').each(function(i) {
			var selection = {
				value  : $(this).val(),
				label  : this.options ? $(this.options[this.selectedIndex]).text() : undefined,
				joinId : this.options ? $(this.options[this.selectedIndex]).data('join-id') : undefined,
				group  : this.options ? $(this.options[this.selectedIndex]).closest('optgroup').prop('label') : undefined
			};
			selected[i] = selection;
		});

		// Create this.model if not exists.
		if (!this.model) { 
			this.model = new this.Model({ id: Number(_.uniqueId()) }); 
		}

		// setAttributes is a function that parses input from form
		// and sets attributes on this.model.
		this.model.setAttributes(selected);

		this.collection.add(this.model);
		this.render();
	};


	InputView.prototype.functionsList = [
		{ 
			group: 'Default', 
			options: [
				{ label: 'Each', value: '' }
			]
		},{ 
			group: 'Aggregators', 
			options: [
				{ label: 'Count of', value: 'count' }, 
				{ label: 'Sum of', value: 'sum' }] 
		},{ 
			group: 'Date formatters', 
			options: [
				{ label: 'Day of', value: 'day' }, 
				{ label: 'Month of', value: 'month' }, 
				{ label: 'Quarter of', value: 'quarter' }, 
				{ label: 'Year of', value: 'quarter' }
			]
		}
	];

	InputView.prototype.operators = [
		{ label: 'Equals', value: 'equals' },
		{ label: 'Does not equal', value: 'notEqual' },
		{ label: 'Greater than', value: 'gt' },
		{ label: 'Greater or equal to', value: 'gte' },
		{ label: 'Less than', value: 'lt' },
		{ label: 'Less or equal to', value: 'lte' }
	];



	// Input Views
	// ==================================================

	var JoinView = InputView.extend({
		template: require('./templates/join.jade'),
		Model: Join
	});

	JoinView.prototype.listen = function() {};


	var SelectView = InputView.extend({
		template: require('./templates/select.jade'),
		Model: Select
	});


	var WhereView = InputView.extend({
		template: require('./templates/where.jade'),
		Model: Where
	});



	// Fieldset Views
	// ==================================================

	var Fieldset = Backbone.View.extend({
		template: require('./templates/fieldset.jade')
	});


	Fieldset.prototype.listen = function() {
		var that = this;
		this.listenTo(this, 'render', function() {

			// If children already exist, render them and return.
			if (that.childViews.length > 0) {
				return that.renderChildren();
			}

			// Else create a new childView and render it.
			var childView = new that.ChildView({ 
				View: that.ChildView,
				ParentView: that.View,
				isRoot: that.isRoot,
				parent: that,
				collection: that.collection,
			});

			that.childViews.push(childView);
			var targetEl = that.$('.content').first();
			childView.render().$el.appendTo(targetEl);
		});
	};


	var JoinSet = Fieldset.extend({
		ChildView: JoinView,
		label: 'Include'
	});

	JoinSet.prototype.View = JoinSet;


	var SelectSet = Fieldset.extend({
		ChildView: SelectView,
		label: 'Select'
	});

	SelectSet.prototype.listen = function() {
		Fieldset.prototype.listen.call(this);
		this.listenToOnce(qb.joinSet.collection, 'add', this.render);
		this.listenTo(qb.joinSet.collection, 'add remove change', this.renderChildren);
	};

	SelectSet.prototype.View = SelectSet;


	var WhereSet = Fieldset.extend({
		ChildView: WhereView,
		label: 'Filter'
	});

	WhereSet.prototype.listen = function() {
		Fieldset.prototype.listen.call(this);
		this.listenTo(qb.joinSet.collection, 'add remove change', this.renderChildren);
	};

	WhereSet.prototype.View = WhereSet;



	// Start app
	// ==================================================
	// Fetch the schema then render the root view. This
	// code is meant to run regardless of whether
	// QueryBuilder is actually available via API (on
	// Github Pages for example), so if the fetch to the
	// server fails, use cached schema instead. This
	// way the UI will function normally, though it will
	// not be able to reach the server to retrive SQL.

	var browserOnly = false;
	var cachedSchema = require('./cached-schema.json');

	window.tables = tables;

	tables.on('sync', function()  { qb.render(); });
	tables.on('error', function() { useCachedSchema(); });
	tables.fetch();

	function useCachedSchema() {
		tables.reset(cachedSchema);
		browserOnly = true;
		qb.render();
	}


})()