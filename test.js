
var mocha       = require('mocha')
,   expect       = require('chai').expect
,   Qb          = require('./qb')
,   definitions = require('./example-definitions');


var qb = new Qb(definitions);

var spec1 = {
  table: 'users',
  fields: ['id', 'Join date'],
  filters: [
    [{ table: 'users', field: 'id', operator: 'equals', value: 100 }, { table: 'users', field: 'id', operator: 'equals', value: 200 }],
    [{ table: 'users', field: 'Join date', operator: 'equals', value: 200 }]
  ]
};

var spec2 = {
  table: 'users',
  fields: ['id', 'Join date'],
  joins: [
    { 
      table: 'signatures', 
      fields: ['Sign date'],
      joins: [{ table: 'petitions', fields: ['id'] }]
    }
  ]
};

var spec3 = {
  table: 'signatures',
  fields: ['id', 'Sign date'],
  joins: [
    {
      table: 'tags',
      fields: ['name'],
      joins: [{ table: 'petitions'}]
    }
  ]
};

// qb.query(spec1);
// console.log('\n');
// qb.query(spec2);
console.log('\n');
qb.query(spec3);


describe('Testing', function() {

  it('Testing', function() {
    expect(true).to.be.ok;
  });

});