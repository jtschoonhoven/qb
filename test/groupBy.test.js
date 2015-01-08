
var mocha       = require('mocha')
,   expect      = require('chai').expect
,   Qb          = require('../qb');

describe.only('groupBy.test.js', function() {


	describe('Add a GROUP BY clause', function() {

		var def = { users: { columns: ['id', 'name'], as: 'Users' } };
		var qb  = new Qb(def);
		var sql = 'SELECT "Users"."name", COUNT("Users"."id") AS "num" FROM "users" AS "Users" GROUP BY "Users"."name"';

		it('from the selects array.', function() {
			var spec  = { select: [{ name: 'name', groupBy: true }, { name: 'id', function: 'COUNT', as: 'num' }], from: 'users' };
			var query = qb.query(spec);
			expect(query.string).to.equal(sql);
		});

		it('from the selects array.', function() {
			var spec  = { select: [{ name: 'name' }, { name: 'id', function: 'COUNT', as: 'num' }], from: 'users', groupBy: 'name' };
			var query = qb.query(spec);
			expect(query.string).to.equal(sql);
		});

	});

});