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


  describe('Declaring joins', function() {

    it('Columns may be declared in an array', function() {
      var definitions = { users: { columns: ['id', 'created_at'] } };
      var qb = new Qb(definitions);
      console.log(qb.schema[0])
      expect(qb.schema[0])
    });

  });

});