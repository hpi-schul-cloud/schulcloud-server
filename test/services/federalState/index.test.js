const assert = require('assert');
const appPromise = require('../../../src/app');

describe('federalState service', () => {
	let app;
	before(async () => {
		app = await appPromise;
	});

	it('registered the federalStates service', () => {
		assert.ok(app.service('federalStates'));
	});
});
