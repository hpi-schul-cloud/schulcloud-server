const assert = require('assert');
const app = require('../../../src/app');

describe('material service', () => {
	it('registered the material service', () => {
		assert.ok(app.service('materials'));
	});
});
