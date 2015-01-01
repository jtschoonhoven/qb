
var mocha   = require('mocha')
,   expect  = require('chai').expect
,   _       = require('underscore')
,   Qb      = require('../qb');

describe('Define', function() {


  describe('Hidden', function() {

    var definitions = { 
      user_public_info: { 
        columns: [{ name: 'id', hidden: true }, 'name'],
        joins: { user_private_info: {}, user_public_info: {} }
      }, 
      user_private_info: { hidden: true } 
    };

    var qb = new Qb(definitions);

    it('definitions are not included in qb.schema.', function() {
      expect(_.findWhere(qb.schema, { name: 'user_public_info' })).to.exist;
      expect(_.findWhere(qb.schema, { name: 'user_private_info'})).to.not.exist;
    });

    it('columns are excluded from qb.schema.', function() {
      expect(qb.schema.length).to.equal(1);
      expect(_.findWhere(qb.schema[0].columns, { name: 'id' })).to.not.exist;
      expect(_.findWhere(qb.schema[0].columns, { name: 'name' })).to.exist;
    });

    it('tables are excluded from joins in qb.schema.', function() {
      expect(qb.schema.length).to.equal(1);
      expect(_.findWhere(qb.schema[0].joins, { name: 'user_private_info' })).to.not.exist;
      expect(_.findWhere(qb.schema[0].joins, { name: 'user_public_info' })).to.exist;
    });

  });


  describe('Define tables', function() {

    it('as a nested object.', function() {
      var def = { users: {} };
      var qb = new Qb(def);
      var expected = { users: { name: 'users', as: undefined, columns: {}, joins: {} } };
      expect(qb.definitions).to.eql(expected);
    });

    it('with alias', function() {
      var def = { users: { as: 'Users' } };
      var qb = new Qb(def);
      var expected = { users: { name: 'users', as: 'Users', columns: {}, joins: {} } };
      expect(qb.definitions).to.eql(expected);
    });

  });


  describe('Define columns', function() {

    var expected = { 
      id:  { name: "id",  property: undefined, hidden: undefined }, 
      uid: { name: "uid", property: undefined, hidden: undefined } 
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
      id: { name: "id", property: "ID", hidden: undefined },
      uid: { name: "uid", property: "UID", hidden: undefined }
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
      var def = { users: { joins: [{ name: 'posts', target_key: 'uid' }] }, posts: {} };
      var qb = new Qb(def);
      expect(qb.definitions.users.joins).to.eql(expected);
    });

    it('as a nested object', function() {
      var def = { users: { joins: { posts: { target_key: 'uid' } } }, posts: {} };
      var qb = new Qb(def);
      expect(qb.definitions.users.joins).to.eql(expected);
    });

  });


  describe('Define joins with alias', function() {

    var expected = { 
      posts: { name: 'posts', alias: 'Postings', source_key: 'id', target_key: 'uid' } 
    };

    it('as an array of objects', function() {
      var def = { users: { joins: [{ name: 'posts', target_key: 'uid', alias: 'Postings' }] }, posts: {} };
      var qb = new Qb(def);
      expect(qb.definitions.users.joins).to.eql(expected);
    });

    it('as a nested object', function() {
      var def = { users: { joins: { posts: { target_key: 'uid', alias: 'Postings' }} }, posts: {} };
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