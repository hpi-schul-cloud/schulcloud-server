const assert = require('assert');
const chai = require('chai');
const app = require('../../../src/app');

const insightsService = app.service('insights');
const { expect } = chai;


describe.skip('insights service', function test() {
    this.timeout(10000);

    it('registered the insight service', () => {
        assert.ok(insightsService);
    });

    // todo.
    // different queries
    // different requests. create remove should throw unauthorized
    // return correct values

    it('FIND data', () => insightsService.find().then((result) => {
        expect(result.data.length).to.be.above(0);
    }));

});
