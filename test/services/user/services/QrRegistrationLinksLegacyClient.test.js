const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);
const { generateRequestParamsFromUser, generateRequestParams } = require('../../helpers/services/login')(appPromise);

describe('qrRegistrationLinks service tests', () => {
	let app;
	let qrRegistrationLinksLegacyService;
	let accountService;
	let server;

	before(async () => {
		app = await appPromise;
		qrRegistrationLinksLegacyService = app.service('/users/qrRegistrationLinkLegacy');
		accountService = app.service('accounts');
		server = await app.listen(0);
	});

	after((done) => {
		server.close(done);
	});

	const createRegistrationLinks = (requestParams, roleName, classId) =>
		qrRegistrationLinksLegacyService.create(
			{
				roleName,
				classId,
			},
			requestParams,
			app
		);

	describe('CREATE', () => {
        it('should return Forbidden when user without permission tries to generate registration links', async () => {
			const testUser = await testObjects.createTestUser();
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);
			return qrRegistrationLinksLegacyService(userRequestAuthentication, [testUser._id]).catch((err) => {
				expect(err.code).to.equal(403);
				expect(err.name).to.equal('Forbidden');
				expect(err.message).to.equal("You don't have one of the permissions: STUDENT_LIST, TEACHER_LIST.");
			});
        });
        
        it('should return registration link for all users from a class', async () => {
			const testUser = await testObjects.createTestUser({ roles: ['teacher'] });
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);
			return postRegistrationLinks(userRequestAuthentication, [testUser._id]).then((res) => {
				expect(res.length).to.equal(1);
			});
        });

    });
});
