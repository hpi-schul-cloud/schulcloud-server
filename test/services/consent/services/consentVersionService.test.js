const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise());
const { generateRequestParamsFromUser } = require('../../helpers/services/login')(appPromise());
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');

describe('consentVersionService tests', () => {
	let app;
	let server;
	let nestServices;
	let consentVersionService;

	before(async () => {
		app = await appPromise();
		consentVersionService = app.service('/consentVersions');
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		await server.close();
		await closeNestServices(nestServices);
	});

	afterEach(testObjects.cleanup);

	describe('CREATE endpoint', () => {
		it('Superhero user of a school should be able to create a consent version', async () => {
			const usersSchool = await testObjects.createTestSchool();

			const user = await testObjects.createTestUser({ roles: ['superhero'], schoolId: usersSchool._id });
			const params = await generateRequestParamsFromUser(user);

			const consentDocumentData = {
				schoolId: usersSchool._id,
				title: 'Gryffindor Terms of Use',
				consentText: 'Pupils of Gryffindor are not to have friends from Slytherin',
				consentTypes: ['privacy'],
				publishedAt: new Date(),
			};

			const result = await consentVersionService.create(consentDocumentData, params);

			expect(result).not.to.be.undefined;
			expect(result).not.to.be.null;
			expect(result._id).not.to.be.undefined;
			expect(result._id).not.to.be.null;
		});

		it('Administrator user of a school should be able to create a consent version', async () => {
			const usersSchool = await testObjects.createTestSchool();

			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: usersSchool._id });
			const params = await generateRequestParamsFromUser(user);

			const consentDocumentData = {
				schoolId: usersSchool._id,
				title: 'Gryffindor Terms of Use',
				consentText: 'Pupils of Gryffindor are not to have friends from Slytherin',
				consentTypes: ['privacy'],
				publishedAt: new Date(),
			};

			const result = await consentVersionService.create(consentDocumentData, params);

			expect(result).not.to.be.undefined;
			expect(result).not.to.be.null;
			expect(result._id).not.to.be.undefined;
			expect(result._id).not.to.be.null;
		});

		it('Teacher user of a school should NOT be able to create a consent version', async () => {
			const usersSchool = await testObjects.createTestSchool();

			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId: usersSchool._id });
			const params = await generateRequestParamsFromUser(user);

			const consentDocumentData = {
				schoolId: usersSchool._id,
				title: 'Gryffindor Terms of Use',
				consentText: 'Pupils of Gryffindor are not to have friends from Slytherin',
				consentTypes: ['privacy'],
				publishedAt: new Date(),
			};

			try {
				await consentVersionService.create(consentDocumentData, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal("You don't have one of the permissions: SCHOOL_EDIT.");
			}
		});

		it('Student user of a school should NOT be able to create a consent version', async () => {
			const usersSchool = await testObjects.createTestSchool();

			const user = await testObjects.createTestUser({ roles: ['student'], schoolId: usersSchool._id });
			const params = await generateRequestParamsFromUser(user);

			const consentDocumentData = {
				schoolId: usersSchool._id,
				title: 'Gryffindor Terms of Use',
				consentText: 'Pupils of Gryffindor are not to have friends from Slytherin',
				consentTypes: ['privacy'],
				publishedAt: new Date(),
			};

			try {
				await consentVersionService.create(consentDocumentData, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal("You don't have one of the permissions: SCHOOL_EDIT.");
			}
		});

		it('Superhero user of a different school should be able to create a consent version', async () => {
			const usersSchool = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['superhero'], schoolId: usersSchool._id });
			const params = await generateRequestParamsFromUser(user);

			const otherSchool = await testObjects.createTestSchool();

			const consentDocumentData = {
				schoolId: otherSchool._id,
				title: 'Gryffindor Terms of Use',
				consentText: 'Pupils of Gryffindor are not to have friends from Slytherin',
				consentTypes: ['privacy'],
				publishedAt: new Date(),
			};

			const result = await consentVersionService.create(consentDocumentData, params);

			expect(result).not.to.be.undefined;
			expect(result).not.to.be.null;
			expect(result._id).not.to.be.undefined;
			expect(result._id).not.to.be.null;
		});

		it('Administrator of a different school should NOT be able to create a consent version', async () => {
			const usersSchool = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: usersSchool._id });
			const params = await generateRequestParamsFromUser(user);

			const otherSchool = await testObjects.createTestSchool();

			const consentDocumentData = {
				schoolId: otherSchool._id,
				title: 'Gryffindor Terms of Use',
				consentText: 'Pupils of Gryffindor are not to have friends from Slytherin',
				consentTypes: ['privacy'],
				publishedAt: new Date(),
			};

			try {
				await consentVersionService.create(consentDocumentData, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal('You do not have valid permissions to access this.');
			}
		});

		it('Logged-out Superhero of a school should NOT be able to create a consent version', async () => {
			const usersSchool = await testObjects.createTestSchool();

			const user = await testObjects.createTestUser({ roles: ['superhero'], schoolId: usersSchool._id });
			const params = await generateRequestParamsFromUser(user);

			const consentDocumentData = {
				schoolId: usersSchool._id,
				title: 'Gryffindor Terms of Use',
				consentText: 'Pupils of Gryffindor are not to have friends from Slytherin',
				consentTypes: ['privacy'],
				publishedAt: new Date(),
			};

			delete params.authentication;

			try {
				await consentVersionService.create(consentDocumentData, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(401);
				expect(err.message).to.equal('Not authenticated');
			}
		});
	});

	describe('REMOVE endpoint', () => {
		it('Superhero user of a school should be able to remove a consent version', async () => {
			const usersSchool = await testObjects.createTestSchool();

			const user = await testObjects.createTestUser({ roles: ['superhero'], schoolId: usersSchool._id });
			const params = await generateRequestParamsFromUser(user);

			const base64File = await testObjects.createTestBase64File({ schoolId: usersSchool._id });
			const consentVersion = await testObjects.createTestConsentVersion({
				consentDataId: base64File._id,
				schoolId: usersSchool._id,
			});

			const consentResult = await consentVersionService.remove(consentVersion._id, params);
			const base64FilesResult = await app.service('base64Files').find({ query: { _id: base64File._id } });

			expect(consentResult).to.not.be.undefined;
			expect(base64FilesResult.data).to.be.empty;
		});

		it('Administrator user of a school should be able to remove a consent version', async () => {
			const usersSchool = await testObjects.createTestSchool();

			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: usersSchool._id });
			const params = await generateRequestParamsFromUser(user);

			const base64File = await testObjects.createTestBase64File({ schoolId: usersSchool._id });
			const consentVersion = await testObjects.createTestConsentVersion({
				consentDataId: base64File._id,
				schoolId: usersSchool._id,
			});

			const consentResult = await consentVersionService.remove(consentVersion._id, params);
			const base64FilesResult = await app.service('base64Files').find({ query: { _id: base64File._id } });

			expect(consentResult).to.not.be.undefined;
			expect(base64FilesResult.data).to.be.empty;
		});

		it('Teacher user of a school should NOT be able to remove a consent version', async () => {
			const usersSchool = await testObjects.createTestSchool();

			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId: usersSchool._id });
			const params = await generateRequestParamsFromUser(user);

			const base64File = await testObjects.createTestBase64File({ schoolId: usersSchool._id });
			const consentVersion = await testObjects.createTestConsentVersion({
				consentDataId: base64File._id,
				schoolId: usersSchool._id,
			});

			try {
				await consentVersionService.remove(consentVersion._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal("You don't have one of the permissions: SCHOOL_EDIT.");
			}
		});

		it('Student user of a school should NOT be able to remove a consent version', async () => {
			const usersSchool = await testObjects.createTestSchool();

			const user = await testObjects.createTestUser({ roles: ['student'], schoolId: usersSchool._id });
			const params = await generateRequestParamsFromUser(user);

			const base64File = await testObjects.createTestBase64File({ schoolId: usersSchool._id });
			const consentVersion = await testObjects.createTestConsentVersion({
				consentDataId: base64File._id,
				schoolId: usersSchool._id,
			});

			try {
				await consentVersionService.remove(consentVersion._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal("You don't have one of the permissions: SCHOOL_EDIT.");
			}
		});

		it('Superhero user of a different school should be able to remove a consent version', async () => {
			const usersSchool = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['superhero'], schoolId: usersSchool._id });
			const params = await generateRequestParamsFromUser(user);

			const otherSchool = await testObjects.createTestSchool();

			const base64File = await testObjects.createTestBase64File({ schoolId: otherSchool._id });
			const consentVersion = await testObjects.createTestConsentVersion({
				consentDataId: base64File._id,
				schoolId: otherSchool._id,
			});

			const consentResult = await consentVersionService.remove(consentVersion._id, params);
			const base64FilesResult = await app.service('base64Files').find({ query: { _id: base64File._id } });

			expect(consentResult).to.not.be.undefined;
			expect(base64FilesResult.data).to.be.empty;
		});

		it('Administrator of a different school should NOT be able to remove a consent version', async () => {
			const usersSchool = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId: usersSchool._id });
			const params = await generateRequestParamsFromUser(user);

			const otherSchool = await testObjects.createTestSchool();

			const base64File = await testObjects.createTestBase64File({ schoolId: otherSchool._id });
			const consentVersion = await testObjects.createTestConsentVersion({
				consentDataId: base64File._id,
				schoolId: otherSchool._id,
			});

			try {
				await consentVersionService.remove(consentVersion._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(404);
				expect(err.message).to.equal(`no record found for id '${consentVersion._id}'`);
			}
		});

		it('Logged-out Superhero of a school should NOT be able to remove a consent version', async () => {
			const usersSchool = await testObjects.createTestSchool();

			const user = await testObjects.createTestUser({ roles: ['superhero'], schoolId: usersSchool._id });
			const params = await generateRequestParamsFromUser(user);

			const base64File = await testObjects.createTestBase64File({ schoolId: usersSchool._id });
			const consentVersion = await testObjects.createTestConsentVersion({
				consentDataId: base64File._id,
				schoolId: usersSchool._id,
			});

			delete params.authentication;

			try {
				await consentVersionService.remove(consentVersion._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(401);
				expect(err.message).to.equal('Not authenticated');
			}
		});
	});
});
