const assert = require('assert');
const { expect } = require('chai');
const app = require('../../../src/app');
const Privacy = require('../../../src/services/privacy/privacy-model');

describe.only('privacy service', () => {
	const now = new Date();
	it('registered the privacy services', () => {
		assert.ok(app.service('privacy'));
	});

	it('create privacy statement', async () => {
		const p = new Privacy({
			name: 'beispielerklärung',
			body: '#markdown \nsupported content',
			publishedAt: now,
		});
		expect(await p.save());
	});

	it('test statement exist', async () => {
		const cmpDate = new Date(now - 1000);
		const result = await app.service('privacy').find({
			publishedAt: {
				$gt: cmpDate,
			},
			$limit: 0,
		});
		expect(result.total).to.be.greaterThan(0);
	});
});
