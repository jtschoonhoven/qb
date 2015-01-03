var mocha       = require('mocha')
,   expect      = require('chai').expect
,   Qb          = require('../qb');

describe('select.test.js', function() {


  describe('Select a single field', function() {

    var def = { users: { columns: ['id'] } };
    var sql = 'SELECT "users"."id" FROM "users"';
    var qb  = new Qb(def);

    it('given as a string', function() {
      var spec = { select: 'id', from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('given as a string array', function() {
      var spec = { selects: ['id'], from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('given as an object array', function() {
      var spec = { selects: [{ name: 'id' }], from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });


  describe('Select a field with an alias', function() {

    var def = { users: { columns: { id: 'ID' } } };
    var qb  = new Qb(def);

    it('defined in qb.definitions', function() {
      var spec = { select: 'id', from: 'users' };
      var sql  = 'SELECT "users"."id" AS "ID" FROM "users"';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('in query spec', function() {
      var sql  = 'SELECT "users"."id" AS "UID" FROM "users"';
      var spec = { selects: [{ name: 'id', as: 'UID' }], from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });


  describe('Select using a builtin SQL function', function() {

    var def = { users: { columns: ['id'] } };
    var sql = 'SELECT COUNT("users"."id") FROM "users"';
    var qb  = new Qb(def);

    it('given as lowercase string', function() {
      var spec  = { select: [{ name: 'id', functions: 'count' }], from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('given as uppercase string', function() {
      var spec  = { select: [{ name: 'id', functions: 'COUNT' }], from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('given as a string array', function() {
      var spec  = { select: [{ name: 'id', functions: ['COUNT'] }], from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });


  describe('Select using a custom (registered) SQL function', function() {

    var def  = { users: { columns: ['id'] } };
    var spec = { select: [{ name: 'id', functions: 'MY_FUNCTION' }], from: 'users' };
    var qb   = new Qb(def);

    it('with no arguments prefilled', function() {
      qb.registerFunction('MY_FUNCTION');
      var sql = 'SELECT MY_FUNCTION("users"."id") FROM "users"';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('with argument prefilled on left', function() {
      qb.registerFunction('MY_FUNCTION', 'MY_FUNCTION', 'ARG1');
      var sql = 'SELECT MY_FUNCTION(\'ARG1\', "users"."id") FROM "users"';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('with argument prefilled on right', function() {
      qb.registerFunction('MY_FUNCTION', 'MY_FUNCTION', null, 'ARG1');
      var sql = 'SELECT MY_FUNCTION("users"."id", \'ARG1\') FROM "users"';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });


  describe('Select using an unregistered SQL function', function() {

    afterEach(function() { delete qb.functions.MY_FUNCTION; });

    var def = { users: { columns: ['id'] } };
    var qb  = new Qb(def);

    it('given no extra arguments', function() {
      var spec  = { select: [{ name: 'id', functions: ['MY_FUNCTION'] }], from: 'users' };
      var sql   = 'SELECT MY_FUNCTION("users"."id") FROM "users"';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('given an extra argument on left', function() {
      var spec  = { select: [{ name: 'id', functions: [{ name: 'MY_FUNCTION', args: ['ARG'] }] }], from: 'users' };
      var sql   = 'SELECT MY_FUNCTION(\'ARG\', "users"."id") FROM "users"';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('given an extra argument on right', function() {
      var spec  = { select: [{ name: 'id', functions: [{ name: 'MY_FUNCTION', args: [null, 'ARG'] }] }], from: 'users' };
      var sql   = 'SELECT MY_FUNCTION("users"."id", \'ARG\') FROM "users"';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });


  describe('Select using nested SQL function', function() {

    var def = { users: { columns: ['id'] } };
    var sql = 'SELECT COUNT(DISTINCT("users"."id")) FROM "users"';
    var qb  = new Qb(def);

    it('given as an array of strings', function() {
      var spec  = { select: [{ name: 'id', functions: ['count', 'distinct'] }], from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('given as an array of objects', function() {
      var spec  = { select: [{ name: 'id', functions: [{ name: 'count' }, { name: 'distinct' }] }], from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('by defining a custom function in qb.functions', function() {
      qb.functions.COUNT_DISTINCT = function(field) { return field.count().distinct().as(); };
      var spec  = { select: [{ name: 'id', functions: 'COUNT_DISTINCT' }], from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });


  describe.only('Select using sql function with alias', function() {

    var def = { users: { columns: { id: 'ID' } } };
    var qb  = new Qb(def);

    it('defined in qb.definitions', function() {
      var spec = { select: [{ name: 'id', functions: 'count' }], from: 'users' };
      var sql  = 'SELECT COUNT("users"."id") AS "ID_COUNT" FROM "users"';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });

});