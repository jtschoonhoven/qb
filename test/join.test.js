
var mocha       = require('mocha')
,   expect      = require('chai').expect
,   Qb          = require('../qb');

describe('Join', function() {

  describe('Define a single FROM clause', function() {

    var def = { 
      users: { columns: ['id'] },
      posts: {},
      posts_tags: {},
      tags: {}
    };

    var qb = new Qb(def);

    it('with spec.from.', function() {
      var spec = { select: 'id', from: 'users' };
      var query = qb.query(spec);
      console.log(query.string)
    });

  });

});