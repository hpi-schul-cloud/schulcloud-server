const sinon = require('sinon');
const { expect } = require('chai');
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

const { getOrCreateTombstoneUserId, replaceUserWithTombstone, deleteUser } = require('./users.uc');
const userRepo = require('../repo/user.repo');
const registrationPinRepo = require('../repo/registrationPin.repo');

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

	describe('replaceUserWithTombstone', () => {
		it('should successfully replace user with tombstone', async () => {
			const school = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ schoolId: school._id });
			const replaceResult = await replaceUserWithTombstone(user);
			expect(replaceResult.success).to.be.true;

			const replaceData = {
				firstName: 'DELETED',
				lastName: 'USER',
			};

			const result = await userRepo.getUserWithRoles(user._id);
			expect(equalIds(result._id, user._id)).to.be.true;
			expect(result.firstName).to.equal(replaceData.firstName);
			expect(result.lastName).to.equal(replaceData.lastName);
			expect(result.email.indexOf('@deleted') >= 0).to.be.true;
			expect(result).to.haveOwnProperty('deletedAt');
			expect(equalIds(result.schoolId, user.schoolId)).to.be.true;
			expect(result).to.not.haveOwnProperty('firstLogin');
			expect(result.roles.length).to.equal(0);
		});
	});

	describe('deleteUser', () => {
		const registrationPinParams = {
			pin: 'USER_PIN',
			verified: true,
			importHash: 'USER_IMPORT_HASH',
		};

		it('should delete registration pins of the user', async () => {
			const school = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ schoolId: school._id });
			await testObjects.createTestRegistrationPin(registrationPinParams, user);
			await deleteUser(user._id, { user });

			const foundRegistrationPin = await registrationPinRepo.getRegistrationPinsByEmail(user.email);
			expect(foundRegistrationPin).to.be.empty;
		});

		it('should delete registration pins of the user parents', async () => {
			const school = await testObjects.createTestSchool();
			const parent = {
				email: 'parent@example.com',
				firstName: 'Parent',
				lastName: 'User',
			};
			const user = await testObjects.createTestUser({ schoolId: school._id, parents: [parent] });
			await testObjects.createTestRegistrationPin(registrationPinParams, parent);
			await deleteUser(user._id, { user });

			const foundRegistrationPin = await registrationPinRepo.getRegistrationPinsByEmail(parent.email);
			expect(foundRegistrationPin).to.be.empty;
		});
	});
});
