const assert = require('assert');
const { expect } = require('chai');
const app = require('../../../../src/app');

const meService = app.service('/me');
const testObjects = require('../../helpers/testObjects')(app);
const { equal: equalIds } = require('../../../../src/helper/compare').ObjectId;

describe('me service', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
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
