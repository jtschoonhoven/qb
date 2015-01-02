
var mocha       = require('mocha')
,   expect      = require('chai').expect
,   Qb          = require('../qb');

describe('join.test.js', function() {


  describe('Define a single FROM clause', function() {

    var def = { users: { columns: ['id'] } };
    var sql = 'SELECT "users"."id" FROM "users"';
    var qb  = new Qb(def);

    it('with a string in spec.from.', function() {
      var spec  = { select: 'id', from: 'users' };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('with a string array in spec.joins.', function() {
      var spec  = { select: 'id', joins: ['users'] };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('with an object array in spec.joins.', function() {
      var spec  = { select: 'id', joins: [{ name: 'users' }] };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });


  describe('Define an alias for the FROM table', function() {

    var sql = 'SELECT "Users"."id" FROM "users" AS "Users"';

    it('in query spec.', function() {
      var def   = { users: { columns: ['id'] } };
      var spec  = { select: 'id', joins: [{ name: 'users', as: 'Users' }] };
      var qb    = new Qb(def);
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('in definitions.', function() {
      var def   = { users: { as: 'Users', columns: ['id'] } };
      var spec  = { select: 'id', joins: [{ name: 'users' }] };
      var qb    = new Qb(def);
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });


  describe('Define a single JOIN clause', function() {

    var def = { 
      users: { columns: ['id', 'postId'], joins: { posts: { source_key: 'postId' } } },
      posts: { columns: ['id'] }
    };

    var sql = 'SELECT "users"."id" FROM "users" INNER JOIN "posts" ON ("users"."postId" = "posts"."id")';
    var qb  = new Qb(def);

    it('with a string in spec.from.', function() {
      var spec  = { select: 'id', from: 'users', joins: ['posts'] };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('with a string array in spec.joins.', function() {
      var spec  = { select: 'id', joins: ['users', 'posts'] };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('with an object array in spec.joins.', function() {
      var spec  = { select: 'id', joins: [{ name: 'users' }, { name: 'posts' }] };
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });


  describe('Define an alias for the JOIN table', function() {

    var sql = 'SELECT "Posts"."id" FROM "users" INNER JOIN "posts" AS "Posts" ON ("users"."postId" = "Posts"."id")';

    it('in query spec.', function() {
      var def   = { users: { columns: ['id', 'postId'], joins: { posts: { source_key: 'postId' } } }, posts: { columns: ['id'] } };
      var spec  = { select: [{ name: 'id', joinId: 1 }], joins: ['users', { name: 'posts', as: 'Posts', id: 1 }] };
      var qb    = new Qb(def);
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('in definitions.', function() {
      var def   = { users: { columns: ['id', 'postId'], joins: { posts: { source_key: 'postId' } } }, posts: { as: 'Posts', columns: ['id'] } };
      var spec  = { select: [{ name: 'id', joinId: 1 }], joins: ['users', { name: 'posts', id: 1 }] };
      var qb    = new Qb(def);
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });

});