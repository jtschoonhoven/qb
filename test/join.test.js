
var mocha       = require('mocha')
,   expect      = require('chai').expect
,   Qb          = require('../lib');

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


  describe('Join a table on itself', function() {

    var def = { users: { as: 'Users', columns: ['id', 'friend_id'], joins: { users: { source_key: 'friend_id' } } } };
    var qb  = new Qb(def);

    it('without alias', function() {
      var spec  = { select: 'id', from: 'users', join: 'users' };
      var sql   = 'SELECT "Users"."id" FROM "users" AS "Users" INNER JOIN "users" AS "Users_2" ON ("Users"."friend_id" = "Users_2"."id")';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('with alias', function() {
      var spec  = { select: 'id', from: 'users', join: { name: 'users', as: 'Friends' } };
      var sql   = 'SELECT "Users"."id" FROM "users" AS "Users" INNER JOIN "users" AS "Friends" ON ("Users"."friend_id" = "Friends"."id")';
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


  describe('Join via intermediate tables', function() {

      var def = { 
        users: {
          columns: ['id'],
          joins: { 
            posts: { target_key: 'user_id' }, 
            tags: { via: 'posts' } 
          }
        },
        posts: { 
          columns: ['id', 'user_id'], 
          joins: { 
            tags: { via: 'posts_tags' }, 
            users: { source_key: 'user_id' },
            posts_tags: { target_key: 'post_id' }
          }
        }, 
        posts_tags: { 
          hidden: true,
          columns: ['post_id', 'tag_id'], 
          joins: { 
            posts: { source_key: 'post_id' }, 
            tags: { source_key: 'tag_id' } 
          }
        },
        tags: { 
          columns: ['id'],
          join: { posts_tags: { target_key: 'tag_id' } }
        }
      }

      var qb = new Qb(def);

    it('through one intermediate', function() {
      var spec = { select: 'id', from: 'posts', join: 'tags' };
      var sql  = 'SELECT "posts"."id" FROM "posts" INNER JOIN "posts_tags" ON ("posts"."id" = "posts_tags"."post_id") INNER JOIN "tags" ON ("posts_tags"."tag_id" = "tags"."id")';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('through two intermediates', function() {
      var spec = { select: 'id', from: 'users', join: 'tags' };
      var sql  = 'SELECT "users"."id" FROM "users" INNER JOIN "posts" ON ("users"."id" = "posts"."user_id") INNER JOIN "posts_tags" ON ("posts"."id" = "posts_tags"."post_id") INNER JOIN "tags" ON ("posts_tags"."tag_id" = "tags"."id")';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('with alias', function() {
      var spec = { select: 'id', joins: [{ name: 'posts', as: 'Blogs' }, { name: 'tags', as: 'Tags' }] };
      var sql  = 'SELECT "Blogs"."id" FROM "posts" AS "Blogs" INNER JOIN "posts_tags" ON ("Blogs"."id" = "posts_tags"."post_id") INNER JOIN "tags" AS "Tags" ON ("posts_tags"."tag_id" = "Tags"."id")';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });

});