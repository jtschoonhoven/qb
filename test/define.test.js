var mocha   = require('mocha')
,   expect  = require('chai').expect
,   _       = require('underscore')
,   Qb      = require('../qb');

describe.only('Define', function() {


  describe('Hidden tables and columns', function() {

    var definitions = { user_public_info: { }, user_private_info: { hidden: true } };
    var qb = new Qb(definitions);

    it('Hidden definitions are not included in qb.schema.', function() {
      expect(_.findWhere(qb.schema, { id: 'user_public_info' })).to.exist;
      expect(_.findWhere(qb.schema, { id: 'user_private_info'})).to.not.exist;
    });

    it('Hidden definitions are included in qb.models.', function() {
      expect(qb.models.user_public_info).to.exist;
      expect(qb.models.user_private_info).to.exist;
    });

  });


  describe('Declaring columns', function() {

    it('Columns may be declared as an array of strings', function() {
      var definitions = { users: { columns: ['id', 'uid'] } };
      var qb = new Qb(definitions);
      var expected = { 
        id:  { name: "id",  property: "id" }, 
        uid: { name: "uid", property: "uid" } 
      };
      expect(qb.definitions.users.columns).to.eql(expected);
    });

    it('Columns may be declared as an array of objects', function() {
      var definitions = { users: { columns: [{ name: 'id' }, { name: 'uid' }] } };
      var qb = new Qb(definitions);
      var expected = { 
        id:  { name: "id",  property: "id" }, 
        uid: { name: "uid", property: "uid" } 
      };
      expect(qb.definitions.users.columns).to.eql(expected);
    });

  });

});