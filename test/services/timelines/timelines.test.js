const assert = require('assert')
const app = require('../../../src/app')

describe('timelines service', () => {
	it('registered the timelines service', () => {
		assert.ok(app.service('timelines'));
	});
});
