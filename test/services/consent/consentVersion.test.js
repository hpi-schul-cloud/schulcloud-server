const assert = require('assert');
const { expect } = require('chai');
const app = require('../../../src/app');
const { ConsentVersionModel, consentTypes } = require('../../../src/services/consent/model');

describe.only('privacy service', () => {
	const now = new Date();
	it('registered the privacy services', () => {
		assert.ok(app.service('privacy'));
	});

	it('create consentVersion model', async () => {
		const p = new ConsentVersionModel({
			type: consentTypes.PRIVACY,
			consentText: '#markdown \nsupported content',
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
