
var mocha       = require('mocha')
,   expect       = require('chai').expect
,   Qb          = require('./qb')
,   definitions = require('./example-definitions');


var qb = new Qb(definitions);

var spec = {
  model: 'user',
  fields: ['id', 'created_at'] ,
  groupBy: ['id'],
  where: [
    [{ model: 'user', field: 'id', operator: 'equals', value: 100 }, { model: 'user', field: 'id', operator: 'equals', value: 200 }],
    [{ model: 'user', field: 'Join date', operator: 'equals', value: 200 }]
  ]
};

qb.query(spec);


describe('Testing', function() {

  it('Testing', function() {
    expect(true).to.be.ok;
  });

});