const assert = require('assert');
const appPromise = require('../../../src/app');

describe('federalState service', async () => {
	const app = await appPromise;
	it('registered the federalStates service', () => {
		assert.ok(app.service('federalStates'));
	});
});
