const assert = require('assert');
const chai = require('chai');

const { expect } = chai;

const appPromise = require('../../../src/app');


describe('sync service', async () => {
	const app = await appPromise;
	const syncService = app.service('sync');

	it('registered the sync service', () => {
		assert.ok(syncService);
	});

	it('accepts GET and POST requests', async () => {
		for (const method of ['find', 'create']) {
			expect(syncService[method]).to.exist;
		}
		for (const method of ['get', 'update', 'patch', 'remove']) {
			expect(syncService[method]).to.not.exist;
		}
	});
});
