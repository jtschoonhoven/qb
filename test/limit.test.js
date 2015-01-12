
var mocha   = require('mocha')
,   expect  = require('chai').expect
,   _       = require('underscore')
,   Qb      = require('../lib');


describe.only('limit.test.js', function() {


	describe('Add a LIMIT clause', function() {

		var def  = { users: { as: 'Users', columns: ['id', 'name'] } };
		var qb   = new Qb(def);
		var spec = { select: 'id', from: 'users', limit: 5 };
		var sql  = 'SELECT "Users"."id" FROM "users" AS "Users" LIMIT 5';

		it('with an integer', function() {
			var query = qb.query(spec);
			expect(query.string).to.equal(sql);
		});

	});

});