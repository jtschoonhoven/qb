(function() {



	// Child model. A query is composed of nested Spec models.
	var Spec = Backbone.Model.extend({
		defaults: { table: null, fields: [], filters: [], joins: [] }
	});



	// Top level model.
	var Query = Spec.extend({
		url: '/api/qb'
	});



	// Top level view.
	var Form = Backbone.View.extend({
		template: require('./templates/form.jade')
	});



	Form.prototype.initialize = function() {
		this.render();
	};



	Form.prototype.render = function() {
		this.$el.html(this.template());
	};



	// Child view. A Form is composed of nested Fieldsets.
	var Fieldset = Backbone.View.extend({
		template: require('./templates/fieldset.jade')
	});


	// Start app.
	new Form({ el: '#app-goes-here' });

})()