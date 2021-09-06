const chai = require('chai');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise);

const { expect } = chai;

describe.only('years service', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	describe('create', () => {
		it('admin should not be able to create global years', async () => {
			const school = await testObjects.createTestSchool();
			const admin = await testObjects.createTestUser({ schoolId: school._id, roles: ['administrator'] });
			const params = await testObjects.generateRequestParamsFromUser(admin);

			try {
				await app.service('years').create({ startDate: Date.now(), endDate: Date.now() + 10 }, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal("You don't have one of the permissions: YEARS_EDIT.");
			}
		});
	});

	describe('update', () => {
		it('admin should not be able to update global years', async () => {
			const year = await testObjects.createTestYear();
			const school = await testObjects.createTestSchool();
			const admin = await testObjects.createTestUser({ schoolId: school._id, roles: ['administrator'] });
			const params = await testObjects.generateRequestParamsFromUser(admin);

			try {
				await app.service('years').update(year._id, { startDate: Date.now(), endDate: Date.now() + 10 }, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal("You don't have one of the permissions: YEARS_EDIT.");
			}
		});
	});

	describe('patch', () => {
		it('admin should not be able to patch global years', async () => {
			const year = await testObjects.createTestYear();
			const school = await testObjects.createTestSchool();
			const admin = await testObjects.createTestUser({ schoolId: school._id, roles: ['administrator'] });
			const params = await testObjects.generateRequestParamsFromUser(admin);

			try {
				await app.service('years').patch(year._id, { startDate: Date.now() }, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal("You don't have one of the permissions: YEARS_EDIT.");
			}
		});
	});

	describe('remove', () => {
		it('admin should not be able to remove global years', async () => {
			const year = await testObjects.createTestYear();
			const school = await testObjects.createTestSchool();
			const admin = await testObjects.createTestUser({ schoolId: school._id, roles: ['administrator'] });
			const params = await testObjects.generateRequestParamsFromUser(admin);

			try {
				await app.service('years').remove(year._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal("You don't have one of the permissions: YEARS_EDIT.");
			}
		});
	});
});
