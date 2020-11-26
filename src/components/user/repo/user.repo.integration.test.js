const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;

const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const userRepo = require('./user.repo');
const { NotFound } = require('../../../errors');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

chai.use(chaiAsPromised);
const { expect } = chai;

describe('user repository', () => {
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

	describe('getUser', () => {
		it('when called with a valid id, then the user object is returned', async () => {
			const user = await testObjects.createTestUser();

			const result = await userRepo.getUser(user._id);
			expect(equalIds(result._id, user._id)).to.be.true;
			expect(result).to.haveOwnProperty('email');
			expect(result).to.haveOwnProperty('lastName');
		});

		it('when called with an invalid id, then it throws 404', async () => {
			const uid = ObjectId();

			expect(userRepo.getUser(uid)).to.eventually.throw(new NotFound());
		});
	});

	describe('replaceUserWithTombstone', () => {
		it('when called with a valid user, then it removes all properties and replaces with replacedata', async () => {
			const user = await testObjects.createTestUser({ roles: ['teacher'] });
			const replaceData = {
				firstName: 'DELETED',
				lastName: 'USER',
				email: `${Date.now()}@deleted`,
			};

			const result = await userRepo.replaceUserWithTombstone(user._id, replaceData);

			expect(equalIds(result._id, user._id)).to.be.true;
			expect(result.firstName).to.equal(replaceData.firstName);
			expect(result.lastName).to.equal(replaceData.lastName);
			expect(result.email).to.equal(replaceData.email);
			expect(result).to.haveOwnProperty('deletedAt');
			expect(result).to.not.haveOwnProperty('schoolId');
			expect(result).to.not.haveOwnProperty('firstLogin');
			expect(result.roles.length).to.equal(0);
		});

		it('when called with an invalid id, then it throws 404', async () => {
			const uid = ObjectId();
			const replaceData = {
				firstName: 'DELETED',
				lastName: 'USER',
				email: `${Date.now()}@deleted`,
			};
			expect(userRepo.replaceUserWithTombstone(uid, replaceData)).to.eventually.throw(new NotFound());
		});
	});

	describe('getUserRoles', () => {
		it('when called with a valid userid, then it returns an array of populated roles', async () => {
			const user = await testObjects.createTestUser({ roles: ['teacher', 'administrator'] });

			const result = await userRepo.getUserRoles(user._id);

			expect(Array.isArray(result)).to.be.true;
			expect(result.length).to.equal(2);
			result.forEach((role) => {
				expect(role).to.haveOwnProperty('name');
				expect(role).to.haveOwnProperty('permissions');
			});
		});
	});
});
