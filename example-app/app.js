
// NOTE: App.js must be bundled with Browserify and
// Jadeify before use. Use the gulp bundle or gulp watch
// commands to generate bundle.js.

(function() {


	// =========================
	// Query Builder Example App
	// =========================


	// Collections & Models
	// ==================================================

	var Selection = Backbone.Model.extend();


	var Tables = Backbone.Collection.extend({
		url: '/api/schema'
	});


	window.tables = new Tables();
	Backbone.View.prototype.tables = window.tables;

	var Joins = Backbone.Collection.extend();
	var Selects = Backbone.Collection.extend();



	// Extend Backbone View
	// ==================================================

	// Default init behavior.
	Backbone.View.prototype.initialize = function(params) {
		_.extend(this, params);
		this.childViews = [];
		this.listen();
	};


	// Default render behavior.
	Backbone.View.prototype.render = function() {
		this.$el.html(this.template(this));
		this.trigger('render');
		return this;
	};


	// Noop to be overwritten with listener declarations.
	Backbone.View.prototype.listen = function() {};


	// Call remove recursively on each childView.
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

	// The top level view of the app.
	var QueryBuilder = Backbone.View.extend({
		el: '#app-goes-here',
		template: require('./templates/query-builder.jade'),
	});


	QueryBuilder.prototype.listen = function() {
		var that = this;

		// On render, create child fieldsets for joins
		// and selects. Only render joinSet for now.
		this.listenTo(this, 'render', function() {
			that.joinSet = new JoinSet({ 
				el: '.joins', 
				isRoot: true, 
				collection: new Joins(),
			});

			that.selectSet = new SelectSet({ 
				el: '.selects', 
				isRoot: true, 
				collection: new Selects() 
			});

			that.joinSet.render();
		});
	};


	// Init view and store in global for easier debug.
	window.qb = new QueryBuilder();



	// Input View Base Class
	// ==================================================

	var InputView = Backbone.View.extend();


	InputView.prototype.events = {
		'change select'     : 'selectInput',
		'click .add-btn'    : 'addInput',
		'click .remove-btn' : 'removeInput'
	};


	InputView.prototype.removeInput = function(e) {
		e.stopImmediatePropagation();
		this.removeChildren().remove();
		this.collection.remove(this.model);

		var parentIsFieldset = this.parent instanceof Fieldset;
		var parentIsEmpty = this.parent.childViews.length === 1;

		if (parentIsFieldset && parentIsEmpty) {
			return this.parent.removeChildren().remove(); 
		}
	};


	InputView.prototype.addInput = function(e) {
		e.stopImmediatePropagation();

		if (!this.isRoot) {
			var fieldset = new this.ParentView({ 
				el: this.$el.find('.content'),
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

		var targetEl = this.parent.$el.find('.content').first();
		siblingView.render().$el.appendTo(targetEl);
		this.parent.childViews.push(siblingView);
	};


	// Get data from each select in group & store in model.
	InputView.prototype.selectInput = function(e) {
		e.stopImmediatePropagation();
		var that = this;

		if (!this.model) { this.model = new Selection({ id: _.uniqueId() }); }

		this.$el.find('select').each(function(i) {
			var select = {
				value  : $(this).val(),
				label  : $(this.options[this.selectedIndex]).text(),
				group  : $(this.options[this.selectedIndex]).closest('optgroup').prop('label'),
				joinId : $(this.options[this.selectedIndex]).closest('optgroup').data('join-id')
			};
			that.model.set(i, select);
		});

		this.collection.add(this.model);
		this.render();
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


	var SelectView = InputView.extend({
		template: require('./templates/select.jade')
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
			var targetEl = that.$el.find('.content').first();
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


	var FilterSet = Fieldset.extend({});
	var GroupSet  = Fieldset.extend({});



	// Start app
	// ==================================================

	tables.on('sync', function() { qb.render(); });
	tables.fetch();

})()