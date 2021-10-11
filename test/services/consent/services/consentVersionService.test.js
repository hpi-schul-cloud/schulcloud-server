const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);
const { generateRequestParamsFromUser } = require('../../helpers/services/login')(appPromise);

describe('consentVersionService tests', () => {
	let app;
	let server;
	let consentVersionService;

	before(async () => {
		app = await appPromise;
		consentVersionService = app.service('/consentVersions');
		server = await app.listen(0);
	});

	after((done) => {
		server.close(done);
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
});
