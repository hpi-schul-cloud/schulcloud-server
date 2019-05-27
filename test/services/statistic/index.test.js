const assert = require('assert');
const app = require('../../../src/app');

describe('statistic service', () => {
	it('registered the statistics service', () => {
		assert.ok(app.service('statistics'));
	});

	it('should be able to find one value stats', () => {
		assert.ok(app.service('statistics').find());
	});

	it('should be able to get users stats', () => {
		assert.ok(app.service('statistics').find({ qs: 'users' }));
	});
});
