import assert from 'assert';
import appPromise from '../../../src/app';

describe('mail service', async () => {
	const app = await appPromise;
	it('registered the mails service', () => {
		assert.ok(app.service('mails'));
	});
});
