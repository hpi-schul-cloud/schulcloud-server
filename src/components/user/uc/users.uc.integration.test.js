const sinon = require('sinon');
const { expect } = require('chai');
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);

const { getOrCreateTombstoneUserId } = require('./users.uc');
const userRepo = require('../repo/user.repo');

describe('user use case', () => {
	let app;
	let server;

	before(async () => {
		delete require.cache[require.resolve('../../../../src/app')];
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
	});

	describe('getOrCreateTombstoneUserId', () => {
		it('should create the tombstone user only once per school', async () => {
			const school = await testObjects.createTestSchool();
			let user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
			user = await userRepo.getUserWithRoles(user._id);

			const getOrCreateTombstoneUserIdSpy = sinon.spy(userRepo, 'createTombstoneUser');

			await getOrCreateTombstoneUserId(school._id, user);
			await getOrCreateTombstoneUserId(school._id, user);
			await getOrCreateTombstoneUserId(school._id, user);

			expect(getOrCreateTombstoneUserIdSpy.callCount).to.eql(1);
		});
	});
});
