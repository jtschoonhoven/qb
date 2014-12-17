var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var router = express.Router();
var app = express();



// Express config.
app.engine('html', require('ejs').renderFile);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('views', path.join(__dirname, '../'));
app.use(express.static(path.join(__dirname, '../')));



// Setup query builder.
var definitions = require('../example-definitions');
var Qb = require('../qb');
var qb = new Qb(definitions);



// API endpoint to accept QB parameters and return SQL.
app.post('api/build', function(req, res) {
	var spec = req.body;
	var sql = qb.query(spec);
	res.type('text/plain').send(sql);
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



// Server.
var server = app.listen(3000, function() {
  console.log('Express server listening on port 3000');
});