
var mocha       = require('mocha')
,   expect      = require('chai').expect
,   Qb          = require('../lib');

describe('group-by.test.js', function() {

	var def = { users: { columns: ['id', 'name'], as: 'Users' } };
	var qb  = new Qb(def);


	describe('Add an GROUP BY clause from spec.groupBy', function() {

		it('passing a column name as a string', function() {
			var spec  = { select: 'id', from: 'users', groupBy: 'id' };
			var sql   = 'SELECT "Users"."id" FROM "users" AS "Users" GROUP BY "Users"."id"';
			var query = qb.query(spec);
			expect(query.string).to.equal(sql);
		});

		it('passing a string array of column names', function() {
			var spec  = { select: ['id', 'name'], from: 'users', groupBy: ['id', 'name'] };
			var sql   = 'SELECT "Users"."id", "Users"."name" FROM "users" AS "Users" GROUP BY "Users"."id", "Users"."name"';
			var query = qb.query(spec);
			expect(query.string).to.equal(sql);
		});

		it('passing an object', function() {
			var spec  = { select: 'id', from: 'users', groupBy: { name: 'id' } };
			var sql   = 'SELECT "Users"."id" FROM "users" AS "Users" GROUP BY "Users"."id"';
			var query = qb.query(spec);
			expect(query.string).to.equal(sql);
		});

		it('passing an array of objects', function() {
			var spec  = { select: ['id', 'name'], from: 'users', groupBy: [{ name: 'id' }, { name: 'name'}] };
			var sql   = 'SELECT "Users"."id", "Users"."name" FROM "users" AS "Users" GROUP BY "Users"."id", "Users"."name"';
			var query = qb.query(spec);
			expect(query.string).to.equal(sql);
		});

	});


	describe('Add an GROUP BY clause from spec.select', function() {

		it('passing a boolean', function() {
			var spec  = { select: { name: 'id', groupBy: true }, from: 'users' };
			var sql   = 'SELECT "Users"."id" FROM "users" AS "Users" GROUP BY "Users"."id"';
			var query = qb.query(spec);
			expect(query.string).to.equal(sql);
		});

	});


	describe('Use a GROUP BY in combination with', function() {

		it('the DATE function', function() {
			var spec  = { select: [{ name: 'name', groupBy: true, functions: 'date' }], from: 'users' };
			var sql   = 'SELECT DATE("Users"."name") AS "name_date" FROM "users" AS "Users" GROUP BY DATE("Users"."name")';
			var query = qb.query(spec);
			expect(query.string).to.equal(sql);
		});

		it('an ORDER BY clause', function() {
			var spec  = { select: [{ name: 'name', groupBy: true, orderBy: 'desc' }], from: 'users' };
			var sql   = 'SELECT "Users"."name" FROM "users" AS "Users" GROUP BY "Users"."name" ORDER BY "Users"."name" DESC';
			var query = qb.query(spec);
			expect(query.string).to.equal(sql);
		});

	});

});