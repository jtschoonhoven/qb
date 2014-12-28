
var mocha       = require('mocha')
,   expect      = require('chai').expect
,   util        = require('util')
,   Qb          = require('./qb')
,   definitions = require('./example-definitions');


var qb = new Qb(definitions);

var spec1 = {
  from: 'users',
  joins: [{ table: 'signatures', id: 1 }],
  selects: [{ field: 'id' }, { field: 'created_at', joinId: 1 }]
};

var spec2 = {
  from: 'users',
  joins: [{ table: 'petitions', id: 1 }, { table: 'signatures', joinId: 1 }],
  selects: [{ field: 'id' }],
  wheres: [
    [{ table: 'users', field: 'id', operator: 'equals', value: 100 }, { table: 'users', field: 'id', operator: 'equals', value: 200 }],
    [{ table: 'users', field: 'Join date', operator: 'equals', value: 200 }]
  ]
}

// Join via intermediate table.
var spec3 = {
  from: 'petitions',
  joins: [{ table: 'tags' }],
  select: [{ field: 'id' }]
};

// Join same table twice.
var spec4 = {
  from: 'users',
  joins: [{ table: 'petitions', id: 1 }, { table: 'users', joinId: 1 }],
  select: [{ field: 'id' }]
};

// qb.query(spec1);
// qb.query(spec2);
// qb.query(spec3);
qb.query(spec4);


describe('Testing', function() {

  it('Testing', function() {
    expect(true).to.be.ok;
  });

});