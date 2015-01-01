
var mocha   = require('mocha')
,   expect  = require('chai').expect
,   _       = require('underscore')
,   Qb      = require('../qb');

describe.only('Define', function() {


  describe('Hidden', function() {

    var definitions = { user_public_info: {}, user_private_info: { hidden: true } };
    var qb = new Qb(definitions);

    it('definitions are not included in qb.schema.', function() {
      expect(_.findWhere(qb.schema, { name: 'user_public_info' })).to.exist;
      expect(_.findWhere(qb.schema, { name: 'user_private_info'})).to.not.exist;
    });

    it('definitions are included in qb.models.', function() {
      expect(qb.models.user_public_info).to.exist;
      expect(qb.models.user_private_info).to.exist;
    });

  });


  describe('Define columns', function() {

    var expected = { 
      id:  { name: "id",  property: undefined }, 
      uid: { name: "uid", property: undefined } 
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
      id: { name: "id", property: "ID" },
      uid: { name: "uid", property: "UID" }
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


  describe('Define joins', function() {

    var expected = { 
      posts: { name: 'posts', alias: undefined, source_key: 'id', target_key: 'uid' } 
    };

    it('as an array of objects', function() {
      var def = { users: { joins: [{ name: 'posts', target_key: 'uid' }] } };
      var qb = new Qb(def);
      expect(qb.definitions.users.joins).to.eql(expected);
    });

    it('as a nested object', function() {
      var def = { users: { joins: { posts: { target_key: 'uid' }} } };
      var qb = new Qb(def);
      expect(qb.definitions.users.joins).to.eql(expected);
    });

  });


  describe('Define joins with alias', function() {

    var expected = { 
      posts: { name: 'posts', alias: 'Postings', source_key: 'id', target_key: 'uid' } 
    };

    it('as an array of objects', function() {
      var def = { users: { joins: [{ name: 'posts', target_key: 'uid', alias: 'Postings' }] } };
      var qb = new Qb(def);
      expect(qb.definitions.users.joins).to.eql(expected);
    });

    it('as a nested object', function() {
      var def = { users: { joins: { posts: { target_key: 'uid', alias: 'Postings' }} } };
      var qb = new Qb(def);
      expect(qb.definitions.users.joins).to.eql(expected);
    });

  });


  describe('Primary key', function() {

    it('can be set from table definition', function() {
      var def = { users: { primary_key: 'name', columns: ['name'] }};
      var qb = new Qb(def);
      expect(qb.definitions.users.primary_key).to.equal('name');
    });

  });

});