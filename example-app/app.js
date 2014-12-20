
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

	Backbone.View.prototype.removeChildren = function() {
    _.each(this.childViews || [], function(child) {
    	if (child.model) { joined.remove(child.model); }
      child.removeChildren();
      Backbone.View.prototype.remove.call(child);
    });

    this.childViews = [];
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
		var join = new Join({ parent: this, isRoot: true });
		this.joins.push(join);
	};



	// Join View
	// ==================================================

	var Join = Backbone.View.extend({
		template: require('./templates/join.jade'),
		joins: [],
		events: { 
			'change .select-model select': 'selectModel',
			'click .add-btn' : 'addJoin',
			'click .remove-btn' : 'removeJoin'
		}
	});

	Join.prototype.initialize = function(params) {
		this.parent = params.parent;
		this.isRoot = params.isRoot;
		this.$el.appendTo(this.parent.$el.find('.joins')).first();
		this.render();
	};

	Join.prototype.render = function() {
		this.$el.html(this.template(this));
	};

	Join.prototype.selectModel = function(e) {
		e.stopImmediatePropagation();
		this.removeChildren();

		// Retrieve selected model from this.collection.
		var tableName = this.$el.find('.select-model select').first().val();
		this.model    = schema.findWhere({ name: tableName });

		// Add a new join model to joins collection.
		joined.add({ 
			alias: this.model.get('name'), 
			columns: this.model.get('columns') 
		});

		this.render();

		// If this is the first join view, add a select view.
		if (this.isRoot) {
			var select = new Select({ isRoot: true });
			this.parent.selects.push(select);
		}
	}

	Join.prototype.addJoin = function(e) {
		e.stopImmediatePropagation();
		var newJoin = new Join({ parent: this });
		this.joins.push(newJoin);
	}

	// Join.prototype.removeJoin = function(e) {
	// 	e.stopImmediatePropagation();
	// 	this.removeChildren().remove();
	// }



	// Select, Filter, & Group Views
	// ==================================================
	// The above are deeply similar. To keep things nice
	// and DRY, all inherit from a parent view called
	// InputGroup.

	var InputGroup = Backbone.View.extend({
		events: { 
			'click .add-btn': 'addInput',
			'click .remove-btn': 'removeInput',
		}
	});

	InputGroup.prototype.initialize = function(params) {
		this.isRoot = params.isRoot;
		this.$el.appendTo(queryBuilder.$el.find(this.selector)).first();
		this.listenTo(joined, 'add remove', this.render);
		this.render();
	};

	InputGroup.prototype.render = function() {
		this.$el.html(this.template(this));
	};

	var Select = InputGroup.extend({
		View: Select,
		selector: '.selects',
		template: require('./templates/select.jade')
	});

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