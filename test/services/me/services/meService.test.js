const assert = require('assert');
const { expect } = require('chai');
const appPromise = require('../../../../src/app');

const testObjects = require('../../helpers/testObjects')(appPromise);
const { equal: equalIds } = require('../../../../src/helper/compare').ObjectId;

describe('me service', () => {
	let app;
	let meService;
	let server;

	before(async () => {
		app = await appPromise;
		meService = app.service('legacy/v1/me');
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
	});

	it('registered the me service', () => {
		assert.ok(meService);
	});

	describe('GET', () => {
		it('should return own user', async () => {
			const student = await testObjects.createTestUser({
				roles: ['student'],
				birthday: Date.now(),
				ldapId: 'thisisauniqueid',
			});
			const params = await testObjects.generateRequestParamsFromUser(student);
			params.query = {};
			const result = await meService.find(params);
			expect(result).to.not.be.undefined;
			expect(equalIds(result.id, student._id)).to.be.true;
		});
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});
});
