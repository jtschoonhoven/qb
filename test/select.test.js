var mocha       = require('mocha')
,   expect      = require('chai').expect
,   Qb          = require('../qb');

describe('select.test.js', function() {


  describe('Select a single field', function() {

    var def = { users: { columns: ['id'] } };
    var sql = 'SELECT "users"."id" FROM "users"';
    var qb  = new Qb(def);

    it('given as a string.', function() {
      var spec = { select: 'id', from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('given as a string array.', function() {
      var spec = { select: ['id'], from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('given as an object array.', function() {
      var spec = { select: [{ name: 'id' }], from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });


  describe('Select using a builtin SQL function', function() {

    var def = { users: { columns: ['id'] } };
    var sql = 'SELECT COUNT("users"."id") FROM "users"';
    var qb  = new Qb(def);

    it('given as lowercase string.', function() {
      var spec  = { select: [{ name: 'id', functions: 'count' }], from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('given as uppercase string.', function() {
      var spec  = { select: [{ name: 'id', functions: 'COUNT' }], from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });


  describe('Select using a registered SQL function', function() {

    var def = { users: { columns: ['id'] } };
    var sql = 'SELECT COUNT("users"."id") FROM "users"';
    var qb  = new Qb(def);

  });


  describe('Select using nested SQL function', function() {

    var def = { users: { columns: ['id'] } };
    var sql = 'SELECT COUNT(DISTINCT("users"."id")) FROM "users"';
    var qb  = new Qb(def);

    it('given as an array of strings.', function() {
      var spec  = { select: [{ name: 'id', functions: ['count', 'distinct'] }], from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('given as an array of objects.', function() {
      var spec  = { select: [{ name: 'id', functions: ['count', 'distinct'] }], from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });

});