const { expect } = require('chai');
const app = require('../../../src/app');

// const { someHelperFunction } = require('./helper');

const eduSearch = app.service('edusharing/eduSearch');

describe.only('insights service', () => {
	it('registers correctly', () => {
		expect(app.service('edusharing/eduSearch')).to.not.equal(undefined);
	});
});
