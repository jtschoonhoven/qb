
// NOTE: App.js must be bundled with Browserify and
// Jadeify before use. Use the gulp bundle or gulp watch
// commands to generate bundle.js.

(function() {


	// =========================
	// Query Builder Example App
	// =========================


	// Collections & Models
	// ==================================================

	// Store data from form.
	var Selection = Backbone.Model.extend();

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



	// Extend Backbone View
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



	// Top Level View
	// ==================================================

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



	// Input View Base Class
	// ==================================================

	var InputView = Backbone.View.extend();

	InputView.prototype.onSelect = function() {};

	InputView.prototype.events = {
		'change select'     : 'selectInput',
		'click .add-btn'    : 'addInput',
		'click .remove-btn' : 'removeInput'
	};

	InputView.prototype.addInput = function(e) {
		e.stopImmediatePropagation();

		if (!this.isRoot) {
			var targetEl = this.$el.find('.content');
			console.log(this.el)
			var fieldset = new this.ParentView({ el: targetEl });
			fieldset.render();
			return;
		}

		var targetEl = this.parent.$el.find('.content').first();

		var siblingView = new this.View({
			ParentView: this.ParentView,
			View: this.View, 
			parent: this, 
			collection: this.collection
		});

		siblingView.render().$el.appendTo(targetEl);
		this.parent.childViews.push(siblingView);
	};

	// Get data from each select in group & store in model.
	InputView.prototype.selectInput = function(e) {
		e.stopImmediatePropagation();
		var that = this;

		if (!this.model) { 
			this.model = new Selection({ id: _.uniqueId() }); 
			this.collection.add(this.model);
		}

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


	InputView.prototype.functionsList = [
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



	// Input Views
	// ==================================================

	var JoinView = InputView.extend({
		template: require('./templates/join.jade')
	});

	JoinView.prototype.onSelect = function() {
		qb.selectSet.render();
	};

	var SelectView = InputView.extend({
		template: require('./templates/select.jade')
	});

	var FilterView = InputView.extend({});
	var GroupView = InputView.extend({});



	// Fieldset Views
	// ==================================================

	var Fieldset = Backbone.View.extend({
		template: require('./templates/fieldset.jade')
	});

	Fieldset.prototype.onRender = function() {
		var targetEl  = this.$el.find('.content').first();
		var childView = new this.ChildView({ 
			View: this.ChildView,
			ParentView: this.View,
			isRoot: true, 
			parent: this,
			collection: this.collection,
		});
		this.childViews.push(childView);
		childView.render().$el.appendTo(targetEl);
	};

	var JoinSet = Fieldset.extend({
		ChildView: JoinView,
		collection: new Joins(),
	});

	JoinSet.prototype.View = JoinSet;

	var SelectSet = Fieldset.extend({
		ChildView: SelectView,
		collection: new Selects()
	});

	SelectSet.prototype.View = SelectSet;

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