const { expect } = require('chai');
const app = require('../../../src/app');

// const { someHelperFunction } = require('./helper');

const someService = app.service('edusharing/someService');
describe.only('insights service', () => {
	it('registers correctly', () => {
		expect(app.service('edusharing/someService')).to.not.equal(undefined);
	});
});
