
// NOTE: App.js must be bundled with Browserify and
// Jadeify before use. Use the gulp bundle or gulp watch
// commands to generate bundle.js.

(function() {


	// =========================
	// Query Builder Example App
	// =========================


	// Models & Collections
	// ==================================================
	// Join:   Single join used in the current query.
	// Table:  Single table defined to Query Builder.
	// Joined: Collection of joins used in the query.
	// Schema: Collection of defined tables in DB.

	var Table = Backbone.Model.extend({
		defaults: { id: null, name: null, columns: [], joins: [] }
	});

	var Join = Backbone.Model.extend({
		initialize: function() { this.id = _.uniqueId(); },
		defaults: { alias: null, columns: null }
	});

	var Schema = Backbone.Collection.extend({
		url: '/api/schema',
		model: Table
	});

	var Joined = Backbone.Collection.extend({
		model: Join
	});

	var joined = new Joined();
	var schema = new Schema();


	// Extend Backbone.View
	// ==================================================

	Backbone.View.prototype.removeChildJoins = function() {
    _.each(this.joins || [], function(join) {
    	if (join.model) { joined.remove(join.model); }
      join.removeChildJoins();
      Backbone.View.prototype.remove.call(join);
    });

    this.joins = [];
    return this;
	};

	// Make schemas available to all views.
	Backbone.View.prototype.schema = schema;
	Backbone.View.prototype.joined = joined;



	// QueryBuilder View
	// ==================================================
	// The top level view of the app.

	var QueryBuilder = Backbone.View.extend({
		template : require('./templates/query-builder.jade'),
		joins    : [],
		selects  : [],
		filters  : [],
		groups   : []
	});

	QueryBuilder.prototype.render = function() {
		this.$el.html(this.template(this));
		var joinView = new JoinView({ parent: this, isRoot: true });
		this.joins.push(joinView);
	};



	// Join View
	// ==================================================

	var JoinView = Backbone.View.extend({
		template: require('./templates/join.jade'),
		joins: [],
		events: { 
			'change .select-model select': 'selectModel',
			'click .add-btn' : 'addJoin',
			'click .remove-btn' : 'removeJoin'
		}
	});

	JoinView.prototype.initialize = function(params) {
		this.parent = params.parent;
		this.isRoot = params.isRoot;
		this.$el.appendTo(this.parent.$el.find('.joins')).first();
		this.render();
	};

	JoinView.prototype.render = function() {
		this.$el.html(this.template(this));
	};

	JoinView.prototype.selectModel = function(e) {
		e.stopImmediatePropagation();
		this.removeChildJoins();

		if (this.model) { joined.remove(this.model); }

		// Retrieve selected model from this.collection.
		var tableId = this.$el.find('select').first().val();
		var alias   = this.$el.find('select option:selected').text();
		var table   = schema.get(tableId);

		this.model = new Join({
			name: tableId,
			alias: alias,
			columns: table.get('columns'),
			joins: table.get('joins')
		});

		joined.add(this.model);

		this.render();

		// Add a select view if not already present.
		if (queryBuilder.selects.length === 0) {
			var select = new Select({ isRoot: true, View: Select });
			queryBuilder.selects.push(select);
		}
	};

	JoinView.prototype.addJoin = function(e) {
		e.stopImmediatePropagation();
		var newJoin = new JoinView({ parent: this });
		this.joins.push(newJoin);
	};

	JoinView.prototype.removeJoin = function(e) {
		e.stopImmediatePropagation();
		this.removeChildJoins().remove();
		this.model.destroy();
	};



	// Select, Filter, & Group Views
	// ==================================================
	// The above are deeply similar. To keep things nice
	// and DRY, all inherit from a parent view called
	// InputGroup.

	var InputGroup = Backbone.View.extend({
		events: { 
			'change select': 'selectOption',
			'click .add-btn': 'addInput',
			'click .remove-btn': 'remove',
		}
	});

	InputGroup.prototype.initialize = function(params) {
		this.isRoot = params.isRoot;
		this.View = params.View;
		this.selected = [];
		this.$el.appendTo(queryBuilder.$el.find(this.selector)).first();
		this.listenTo(joined, 'add remove', this.render);
		this.render();
	};

	InputGroup.prototype.render = function() {
		this.$el.html(this.template(this));
	};

	// Get optgroup and value for each select in el.
	InputGroup.prototype.selectOption = function(e) {
		e.stopImmediatePropagation();
		var that = this;
		this.$el.find('select').each(function(i) {
			that.selected[i] = {
				opt: $(this).val(),
				group: $(this.options[this.selectedIndex]).closest('optgroup').prop('label')
			};
		});
		this.render();
	};

	InputGroup.prototype.addInput = function(e) {
		e.stopImmediatePropagation();
		var newInput = new this.View({ View: Select });
		queryBuilder.selects.push(newInput);
	};

	var Select = InputGroup.extend({
		selector: '.selects',
		template: require('./templates/select.jade')
	});

	Select.prototype.functionsList = [
		{ 
			label: 'Default', 
			options: [
				{ label: 'Each', val: 'each' }
			]
		},{ 
			label: 'Aggregators', 
			options: [
				{ label: 'Count of', val: 'count' }, 
				{ label: 'Sum of', val: 'sum' }] 
		},{ 
			label: 'Date formatters', 
			options: [
				{ label: 'Day of', val: 'day' }, 
				{ label: 'Month of', val: 'month' }, 
				{ label: 'Quarter of', val: 'quarter' }, 
				{ label: 'Year of', val: 'quarter' }
			]
		}
	];

	// var Group = InputGroup.extend({
	// 	View: Group,
	// 	selector: '.groups',
	// 	template: require('./templates/groupBy.jade')
	// });

	// var Filter = InputGroup.extend({
	// 	View: Filter,
	// 	selector: '.filters',
	// 	template: require('./templates/filter.jade')
	// });



	// Start app
	// ==================================================
	// Get schema and render view. Normally this would be 
	// returned by a GET request to /api/schema, but this
	// avoid the Node dependency.

	var queryBuilder = new QueryBuilder({ el: '#app-goes-here' });

	schema.on('sync', function() {
		console.log(schema.toJSON());
		queryBuilder.render();
	});

	schema.fetch();

})()