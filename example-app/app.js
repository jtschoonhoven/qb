
// NOTE: App.js must be bundled with Browserify and
// Jadeify before use. Use the gulp bundle or gulp watch
// commands to generate bundle.js.

(function() {



	// =========================
	// Query Builder Example App
	// =========================



	// Models
	// ==================================================

	// Store data from form.
	var Selection = Backbone.Model.extend();



	// Collections
	// ==================================================

	// A map of defined tables, fetched from server.
	var Tables = Backbone.Collection.extend({
		url: '/api/schema'
	});

	window.tables = new Tables();
	Backbone.View.prototype.tables = window.tables;

	var Joins = Backbone.Collection.extend({});
	var Selects = Backbone.Collection.extend({});
	var Filters = Backbone.Collection.extend({});
	var Groups = Backbone.Collection.extend({});



	// Views
	// ==================================================



	// Set default (prototype) view behavior.
	Backbone.View.prototype.initialize = function(params) {
		_.extend(this, params);
		this.childViews = [];
		this.selected = [];
		this.listen();
	};

	Backbone.View.prototype.render = function(el) {
		if (el) { this.$el = el }
		this.$el.html(this.template(this));
		this.onRender();
		return this;
	};

	Backbone.View.prototype.listen = function() {};
	Backbone.View.prototype.onRender = function() {};



	// Top level view.
	var QueryBuilder = Backbone.View.extend({
		el: '#app-goes-here',
		template: require('./templates/query-builder.jade'),
	});

	// Render a joinSet on this.render.
	QueryBuilder.prototype.onRender = function() {
		this.joinSet = new JoinSet({ el: '.joins' });
		this.selectSet = new SelectSet({ el: '.selects' });
		this.joinSet.render();
	};

	window.qb = new QueryBuilder();



	// Base class for joins, selects, etc.
	var InputView = Backbone.View.extend();

	InputView.prototype.onSelect = function() {};

	InputView.prototype.events = {
		'change select'     : 'selectInput',
		'click .add-btn'    : 'addInput',
		'click .remove-btn' : 'removeInput'
	};

	// Get data from each select in group & store in model.
	InputView.prototype.selectInput = function(e) {
		e.stopImmediatePropagation();

		var that = this;
		if (!this.model) { this.model = new Selection(); }

		this.$el.find('select').each(function(i) {
			var select = {
				value  : $(this).val(),
				label  : $(this.options[this.selectedIndex]).text(),
				group  : $(this.options[this.selectedIndex]).closest('optgroup').prop('label'),
				joinId : $(this.options[this.selectedIndex]).closest('optgroup').data('join-id')
			};
			that.model.set(i, select);
		});

		this.render();
		this.onSelect();
	};



	var JoinView = InputView.extend({
		template: require('./templates/join.jade')
	});

	JoinView.prototype.onSelect = function() {
		qb.selectSet.render();
	};

	var SelectView = InputView.extend({
		template: require('./templates/select.jade')
	});

	SelectView.prototype.functionsList = [
		{ 
			group: 'Default', 
			options: [
				{ label: 'Each', value: 'each' }
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

	var FilterView = InputView.extend({});
	var GroupView = InputView.extend({});



	// Wrapper/parent for a set of inputs.
	var Fieldset = Backbone.View.extend({
		template: require('./templates/fieldset.jade')
	});

	Fieldset.prototype.onRender = function() {
		var targetEl  = this.$el.find('.content').first();
		var childView = new this.ChildView({ isRoot: true, el: targetEl });
		this.childViews.push(childView);
		childView.render();
	};

	var JoinSet = Fieldset.extend({
		ChildView: JoinView,
		collection: new Joins(),
		name: 'Include'
	});

	var SelectSet = Fieldset.extend({
		ChildView: SelectView,
		collection: new Selects(),
		name: 'Select'
	});

	var FilterSet = Fieldset.extend({});
	var GroupSet  = Fieldset.extend({});



	// Start app
	// ==================================================

	tables.on('sync', function() { 
		qb.render(); 
		qb.joinSet.render();
	});
	tables.fetch();

})()