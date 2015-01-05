
var mocha   = require('mocha')
,   expect  = require('chai').expect
,   _       = require('underscore')
,   Qb      = require('../qb');

describe.only('where.test.js', function() {

  describe('Filter with a WHERE clause', function() {

    var def = { users: { columns: ['id'] } };
    var qb  = new Qb(def);

    it('given as an object', function() {
      var spec = { select: ['id'], from: 'users', where: { field: 'id', op: 'equal', match: 1 } };
      var query = qb.query(spec);
      console.log(query.string);
    });

  });

});