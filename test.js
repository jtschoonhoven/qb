
var mocha       = require('mocha')
,   expect       = require('chai').expect
,   Qb          = require('./qb')
,   definitions = require('./example-definitions');


var qb = new Qb(definitions);

var spec1 = {
  model: 'users',
  fields: ['id', 'created_at'],
  where: [
    [{ model: 'users', field: 'id', operator: 'equals', value: 100 }, { model: 'users', field: 'id', operator: 'equals', value: 200 }],
    [{ model: 'users', field: 'Join date', operator: 'equals', value: 200 }]
  ]
};

var spec2 = {
  model: 'users',
  fields: ['id', 'created_at'],
  joins: [
    { 
      model: 'signatures', 
      fields: ['created_at'],
      joins: [{ model: 'petitions', fields: ['id'] }]
    }
  ]
};

var spec3 = {
  model: 'signatures',
  fields: ['id', 'created_at'],
  joins: [
    {
      model: 'tags',
      joins: [{ model: 'petitions'}]
    }
  ]
};

// qb.query(spec1);
qb.query(spec2);
// qb.query(spec3);


describe('Testing', function() {

  it('Testing', function() {
    expect(true).to.be.ok;
  });

});