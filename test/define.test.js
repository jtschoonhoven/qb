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


  describe('Define columns', function() {

    var expected = { 
      id:  { name: "id",  property: "id" }, 
      uid: { name: "uid", property: "uid" } 
    };

    it('as an array of strings', function() {
      var def = { users: { columns: ['id', 'uid'] } };
      var qb = new Qb(def);
      expect(qb.definitions.users.columns).to.eql(expected);
    });

    it('as an array of objects', function() {
      var def = { users: { columns: [{ name: 'id' }, { name: 'uid' }] } };
      var qb = new Qb(def);
      expect(qb.definitions.users.columns).to.eql(expected);
    });

    it('as a flat object', function() {
      var def = { users: { columns: { id: null, uid: null } }};
      var qb = new Qb(def);
      expect(qb.definitions.users.columns).to.eql(expected);
    });

  });

  describe('Define columns with alias', function() {

    var expected = {
      ID: { name: "id", property: "ID" },
      UID: { name: "uid", property: "UID" }
    };

    it('as an array of objects', function() {
      var def = { users: { columns: [{ name: 'id', property: "ID" }, { name: 'uid', property: "UID" }] } };
      var qb = new Qb(def);
      expect(qb.definitions.users.columns).to.eql(expected);
    });

    it('as a flat object', function() {
      var def = { users: { columns: { id: "ID", uid: "UID" } }};
      var qb = new Qb(def);
      expect(qb.definitions.users.columns).to.eql(expected);
    });

    it('as a nested object', function() {
      var def = { users: { columns: { a: { name: "id", property: "ID" }, b: { name: "uid", property: "UID" } } }};
      var qb = new Qb(def);
      expect(qb.definitions.users.columns).to.eql(expected);
    });

  });

  describe('Primary key', function() {

    it('can be set from table definition', function() {
      var def = { users: { primary_key: 'ID', columns: { id: 'ID' } }};
      var qb = new Qb(def);
      expect(qb.definitions.users.primary_key).to.eql('ID');
    });

    it('can be set from array column definition', function() {
      var def = { users: { columns: [{ name: 'id', property: 'ID', primary_key: true } ]} };
      var qb = new Qb(def);
      expect(qb.definitions.users.primary_key).to.eql('ID');
    });

    it('can be set from nested object column definition', function() {
      var def = { users: { columns: { id: { name: 'id', property: 'ID', primary_key: true } } } };
      var qb = new Qb(def);
      expect(qb.definitions.users.primary_key).to.eql('ID');
    });

  });

});