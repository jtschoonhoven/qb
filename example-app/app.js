
// NOTE: App.js must be bundled with Browserify and
// Jadeify before use. Use the gulp bundle or gulp watch
// commands to generate bundle.js.

(function() {


	// =========================
	// Query Builder Example App
	// =========================



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