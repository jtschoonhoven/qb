
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
		console.log(this.joins.toArray())
    _.each(this.joins.toArray() || [], function(join) {
    	if (join.model) { joined.remove(join.model); }
      join.removeChildJoins();
      Backbone.View.prototype.remove.call(join);
    });

    this.joins.reset();
    return this;
	};

	Backbone.View.prototype.render = function() {
		this.$el.html(this.template(this));
	};

	// Make schemas available to all views.
	Backbone.View.prototype.schema = schema;
	Backbone.View.prototype.joined = joined;



	// Fieldset View
	// ==================================================
	// Selects, filters and groups all nest inside of one
	// of these parent fieldsets.

	var Fieldset = Backbone.View.extend({
		collection: new Backbone.Collection(),
		template: require('./templates/fieldset.jade')
	});

	Fieldset.prototype.initialize = function(params) {
		this.name = params.name;
		this.render();
		var child = new params.View({ isRoot: true, View: params.View, id: _.uniqueId() });
		this.collection.add(child);
	};



	// QueryBuilder View
	// ==================================================
	// The top level view of the app.

	var QueryBuilder = Backbone.View.extend({
		template: require('./templates/query-builder.jade')
	});

	QueryBuilder.prototype.render = function() {
		this.$el.html(this.template(this));
		var joinView = new JoinView({ parent: this, isRoot: true });
		this.joins = new Backbone.Collection();
		this.joins.add(joinView);
	};

	var queryBuilder = new QueryBuilder({ el: '#app-goes-here' });
	window.qb = queryBuilder;



	// Join View
	// ==================================================

	var JoinView = Backbone.View.extend({
		template: require('./templates/join.jade'),
		joins: new Backbone.Collection(),
		events: { 
			'change .select-model select': 'selectModel',
			'click .add-btn' : 'addJoin',
			'click .remove-btn' : 'removeJoin'
		}
	});

	JoinView.prototype.initialize = function(params) {
		this.parent    = params.parent;
		this.isRoot    = params.isRoot;
		this.$el.appendTo(this.parent.$el.find('.joins')).first();
		this.render();
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

		this.joinId = this.model.id;
		this.render();

		// Add a select view if not already present.
		if (!queryBuilder.selects) {
			queryBuilder.selects = new Fieldset({ name: 'Select', View: Select, el: $('.selects') });
		}
	};

	JoinView.prototype.addJoin = function(e) {
		e.stopImmediatePropagation();
		var newJoin = new JoinView({ parent: this });
		this.joins.add(newJoin);
	};

	JoinView.prototype.removeJoin = function(e) {
		e.stopImmediatePropagation();
		this.removeChildJoins().remove();
		this.model.destroy();
	};


	// InputGroup Views: Select, Filter, & Group
	// ==================================================
	// The above are deeply similar. To keep things nice
	// and DRY, all inherit from a parent view called
	// InputGroup.

	var InputGroup = Backbone.View.extend({
		events: { 
			'change select': 'selectOption',
			'click .add-btn': 'addInput',
			'click .remove-btn': 'removeInput',
		}
	});

	InputGroup.prototype.initialize = function(params) {
		this.isRoot = params.isRoot;
		this.View = params.View;
		this.selected = [];
		this.$el.appendTo($(this.selector));
		this.listenTo(joined, 'add remove', this.render);
		this.render();
	};

	// Get optgroup and value for each select in el.
	InputGroup.prototype.selectOption = function(e) {
		e.stopImmediatePropagation();
		var that = this;
		this.$el.find('select').each(function(i) {
			that.selected[i] = {
				opt: $(this).val(),
				group: $(this.options[this.selectedIndex]).closest('optgroup').prop('label'),
				joinId: $(this.options[this.selectedIndex]).closest('optgroup').data('join-id')
			};
		});
		this.render();
	};

	InputGroup.prototype.addInput = function(e) {
		e.stopImmediatePropagation();
		var newInput = new this.View({ View: Select, id: _.uniqueId() });
		queryBuilder.selects.collection.add(newInput);
	};

	InputGroup.prototype.removeInput = function(e) {
		e.stopImmediatePropagation();
		queryBuilder.selects.collection.remove(this.id);
		this.remove();
	};

	var Select = InputGroup.extend({
		selector: '.selects .input-groups',
		collection: queryBuilder.selects,
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

	schema.on('sync', function() {
		// console.log(schema.toJSON());
		queryBuilder.render();
	});

	schema.fetch();

})()