
var mocha       = require('mocha')
,   expect      = require('chai').expect
,   Qb          = require('../qb');


describe('register-functions.test.js', function() {

  var def  = { users: { columns: ['id'] } };
  var qb   = new Qb(def);
  var spec = { from: 'users', select: [{ name: 'id', functions: 'MY_FUNC' }] };


  describe('Register a new sql function', function() {

    it('with name given as uppercase string', function() {
      qb.registerFunction('MY_FUNC');
      expect(qb.functions.MY_FUNC).to.exist;
    });

    it('with name given as lowercase string', function() {
      qb.registerFunction('my_func');
      expect(qb.functions.MY_FUNC).to.exist;
    });

  });


  describe('Register a sql function with prefilled arguments', function() {

    it('that are always inserted before user input', function() {
      qb.registerFunction('MY_FUNC', 'ARG1', 'ARG2');
      var sql  = 'SELECT MY_FUNC(\'ARG1\', \'ARG2\', "users"."id") FROM "users"';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('that are always inserted after user input', function() {
      qb.registerFunction('MY_FUNC', null, 'ARG1', 'ARG2');
      var sql  = 'SELECT MY_FUNC("users"."id", \'ARG1\', \'ARG2\') FROM "users"';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });

});