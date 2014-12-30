
var express      = require('express')
,   path         = require('path')
,   bodyParser   = require('body-parser')
,   ejs          = require('ejs')
,   app          = express();


// ===========
// Example API
// ===========


// This is a simple Node server that demonstrates
// how QueryBuilder might work on the backend. It
// exposes two API endpoints. /api/schema returns
// a map of the database defined in
// example-definitions.js and /api/build accepts
// query parameters and returns raw SQL.



// Config
// ==================================================

app.engine('html', require('ejs').renderFile);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('views', path.join(__dirname, '../'));
app.use(express.static(path.join(__dirname, '../')));



// Query Builder
// ==================================================

var definitions = require('../test/test-definitions');
var Qb = require('../qb');
var qb = new Qb(definitions, 'postgres');



// Routes
// ==================================================

// API endpoint to accept QB parameters and return SQL.
app.post('/api/build', function(req, res) {
	var spec = JSON.parse(req.body.data);
  var status = 'success';

  var result = qb.query(spec);
  // try { var result = qb.query(spec); }
  // catch(err) {
  //   console.log(err);
  //   console.log(spec);
  //   status = 'error';
  //   result = err.message;
  // }

  res.json({ status: status, result: result });
});

// API endpoint that returns QB schema.
app.get('/api/schema', function(req, res) {
	var schema = qb.schema;
	res.json(schema);
});

// Frontend route.
app.get('*', function(req, res) {
  res.render('index.html');
});



// Server
// ==================================================

var server = app.listen(3000, function() {
  console.log('Express server listening on port 3000');
});