
var mocha       = require('mocha')
,   expect       = require('chai').expect
,   Qb          = require('./qb')
,   definitions = require('./example-definitions');


var qb = new Qb(definitions);

console.log(qb.schema)


describe('Testing', function() {

  it('Testing', function() {
    expect(true).to.be.ok;
  });

});