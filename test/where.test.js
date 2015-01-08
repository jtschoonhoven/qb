
var mocha   = require('mocha')
,   expect  = require('chai').expect
,   _       = require('underscore')
,   Qb      = require('../lib');

describe('where.test.js', function() {


    var def = { 
      users: { columns: ['id', 'postId'], joins: { posts: { source_key: 'postId' } } }, 
      posts: { columns: { id: 'ID', title: 'Title' }, as: 'Blogs' } 
    };

    var qb  = new Qb(def);


  describe('Filter', function() {

    it('against a static value', function() {
      var spec  = { select: 'id', from: 'users', where: { field: 'id', match: { value: 1 } } };
      var sql   = 'SELECT "users"."id" FROM "users" WHERE ("users"."id" = 1)';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('against another column', function() {
      var spec  = { select: 'id', from: 'users', where: { field: 'id', match: 'postId' } };
      var sql   = 'SELECT "users"."id" FROM "users" WHERE ("users"."id" = "users"."postId")';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('against a joined column', function() {
      var spec  = { 
        select : 'id', 
        from   : 'users', 
        join   : [{ name: 'posts', id: 1 }], 
        where  : { field: { name: 'id', joinId: 1 }, match: { value: 1 } }
      };
      var sql   = 'SELECT "users"."id" FROM "users" INNER JOIN "posts" AS "Blogs" ON ("users"."postId" = "Blogs"."id") WHERE ("Blogs"."id" = 1)';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('using multiple filters', function() {
      var spec  = { 
        select: 'id', 
        from: 'users', 
        where: [
          { field: 'id', match: { value: 1 } }, 
          { field: 'postId', match: { value: 2 } }
        ]
      };
      var sql   = 'SELECT "users"."id" FROM "users" WHERE (("users"."id" = 1) AND ("users"."postId" = 2))';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('with OR logic', function() {
      var spec = { 
        select: 'id', 
        from: 'users', 
        where: { 
          or: [{ field: 'id', match: { value: 1 } }, { field: 'id', match: { value: 2 } }]
        }
      };
      var sql   = 'SELECT "users"."id" FROM "users" WHERE (("users"."id" = 1) OR ("users"."id" = 2))';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

    it('with AND and OR logic', function() {
      var spec = { 
        select: 'id', 
        from: 'users',
        where: [
          { or: [{ field: 'id', match: { value: 1 } }, { field: 'id', match: { value: 2 } }] },
          { or: [{ field: 'postId', match: { value: 2 } }, { field: 'postId', match: { value: 3 } }] }
        ]
      };
      var sql   = 'SELECT "users"."id" FROM "users" WHERE ((("users"."id" = 1) OR ("users"."id" = 2)) AND (("users"."postId" = 2) OR ("users"."postId" = 3)))';
      var query = qb.query(spec);
      expect(query.string).to.equal(sql);
    });

  });


  describe('Operator', function() {

    var operators = { 
      equal: '=', 
      equals: '=',
      notEqual: '<>',
      notEquals: '<>',
      like: 'LIKE',
      notLike: 'NOT LIKE',
      isNull: 'IS NULL',
      isNotNull: 'IS NOT NULL',
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<=',
      ilike: 'ILIKE',
      notIlike: 'NOT ILIKE'
    };

    for (var name in operators) {
      var value = operators[name];
      var sql   = 'SELECT "users"."id" FROM "users" WHERE ("users"."id" ' + value + ' 42)';
      var spec  = { select: 'id', from: 'users', where: { field: 'id', op: name, match: { value: 42 } } };
      var query = qb.query(spec);

      it('"' + name + '" becomes "' + value + '"', function() {
        expect(query.string).to.equal(sql);
      });
    }

  });

});