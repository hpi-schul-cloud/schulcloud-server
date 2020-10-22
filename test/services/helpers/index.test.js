const assert = require('assert');
const appPromise = require('../../../src/app');

describe('mail service', async () => {
	const app = await appPromise;
	it('registered the mails service', () => {
		assert.ok(app.service('mails'));
	});
});
