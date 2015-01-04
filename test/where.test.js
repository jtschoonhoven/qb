
var mocha   = require('mocha')
,   expect  = require('chai').expect
,   _       = require('underscore')
,   Qb      = require('../qb');

describe.only('where.test.js', function() {

  // filter on defined field
  // filter with function
  // filter referencing selected field
  { where: { field:  'ok' } }

  describe('Filter with a WHERE clause', function() {

    var def = { users: { columns: ['id'] } };
    var qb  = new Qb(def);

    it('given as an object', function() {
      var spec  = { select: ['id'], from: 'users', where: { field: 'id', op: 'equal', filter: 2 } };
      var query = qb.query(spec);
      console.log(spec)
      console.log(query.string);
    });

  });

});