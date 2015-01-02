
var mocha       = require('mocha')
,   expect      = require('chai').expect
,   Qb          = require('../qb');


describe('register-functions.test.js', function() {

  var def  = { users: { columns: ['id'] } };
  var qb   = new Qb(def);


  describe('Register a new sql function', function() {

    var sql = 'SELECT MY_FUNC("users"."id") FROM "users"';

    it('where key is same as function name', function() {
      qb.registerFunction('MY_FUNC');
      var spec  = { select: [{ name: 'id', functions: 'MY_FUNC' }], from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('where key is different from function name', function() {
      qb.registerFunction('MY_KEY', 'MY_FUNC');
      var spec  = { select: [{ name: 'id', functions: 'MY_KEY' }], from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });


  describe('Register a sql function with prefilled arguments', function() {

    var spec = { from: 'users', select: [{ name: 'id', functions: 'MY_FUNC' }] };

    it('that are always inserted before user input', function() {
      qb.registerFunction('MY_FUNC', 'MY_FUNC', 'ARG1', 'ARG2');
      var sql  = 'SELECT MY_FUNC(\'ARG1\', \'ARG2\', "users"."id") FROM "users"';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('that are always inserted after user input', function() {
      qb.registerFunction('MY_FUNC', 'MY_FUNC', null, 'ARG1', 'ARG2');
      var sql  = 'SELECT MY_FUNC("users"."id", \'ARG1\', \'ARG2\') FROM "users"';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });

});