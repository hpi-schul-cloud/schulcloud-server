

const assert = require('assert');
const app = require('../../../src/app');

describe('news service', () => {
	it('registered the news service', () => {
		assert.ok(app.service('news'));
	});
});
