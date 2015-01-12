
var mocha       = require('mocha')
,   expect      = require('chai').expect
,   Qb          = require('../lib');

describe('order-by.test.js', function() {

	var def = { users: { columns: ['id', 'name'], as: 'Users' } };
	var qb  = new Qb(def);


	describe('Add an ORDER BY clause from spec.orderBy', function() {

		it('passing a column name as a string', function() {
			var spec  = { select: 'id', from: 'users', orderBy: 'id' };
			var sql   = 'SELECT "Users"."id" FROM "users" AS "Users" ORDER BY "Users"."id"';
			var query = qb.query(spec);
			expect(query.string).to.equal(sql);
		});

		it('passing a string array of column names', function() {
			var spec  = { select: ['id', 'name'], from: 'users', orderBy: ['id', 'name'] };
			var sql   = 'SELECT "Users"."id", "Users"."name" FROM "users" AS "Users" ORDER BY "Users"."id", "Users"."name"';
			var query = qb.query(spec);
			expect(query.string).to.equal(sql);
		});

		it('passing an object to sort DESC', function() {
			var spec  = { select: 'id', from: 'users', orderBy: { name: 'id', orderBy: 'desc' } };
			var sql   = 'SELECT "Users"."id" FROM "users" AS "Users" ORDER BY "Users"."id" DESC';
			var query = qb.query(spec);
			expect(query.string).to.equal(sql);
		});

		it('passing an array of objects with mixed direction', function() {
			var spec  = { select: ['id', 'name'], from: 'users', orderBy: [{ name: 'id', orderBy: 'desc' }, { name: 'name', orderBy: 'asc' }] };
			var sql   = 'SELECT "Users"."id", "Users"."name" FROM "users" AS "Users" ORDER BY "Users"."id" DESC, "Users"."name"';
			var query = qb.query(spec);
			expect(query.string).to.equal(sql);
		});

	});


	describe('Add an ORDER BY clause from spec.select', function() {

		it('sort ascending', function() {
			var spec  = { select: { name: 'id', orderBy: 'asc' }, from: 'users' };
			var sql   = 'SELECT "Users"."id" FROM "users" AS "Users" ORDER BY "Users"."id"';
			var query = qb.query(spec);
			expect(query.string).to.equal(sql);
		});

		it('sort descending', function() {
			var spec  = { select: { name: 'id', orderBy: 'desc' }, from: 'users' };
			var sql   = 'SELECT "Users"."id" FROM "users" AS "Users" ORDER BY "Users"."id" DESC';
			var query = qb.query(spec);
			expect(query.string).to.equal(sql);
		});

	});

});