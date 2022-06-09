const { expect } = require('chai');
const { MikroORM } = require('@mikro-orm/core');
const { Test } = require('@nestjs/testing');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise());
const { generateRequestParamsFromUser } = require('../../helpers/services/login')(appPromise());

const { ServerFeathersTestModule } = require('../../../../dist/apps/server/server.module');
const { AccountModule } = require('../../../../dist/apps/server/modules/account/account.module');
const { AccountService } = require('../../../../dist/apps/server/modules/account/services/account.service');

describe('qrRegistrationLinksLegacyClient service tests', () => {
	let app;
	let qrRegistrationLinksLegacyService;
	let server;

	let nestApp;
	let orm;

	before(async () => {
		app = await appPromise();
		qrRegistrationLinksLegacyService = app.service('/users/qrRegistrationLinkLegacy');
		server = await app.listen(0);

		const module = await Test.createTestingModule({
			imports: [ServerFeathersTestModule, AccountModule],
		}).compile();
		app = await appPromise;
		server = await app.listen(0);
		nestApp = await module.createNestApplication().init();
		orm = nestApp.get(MikroORM);

		app.services['nest-account-service'] = nestApp.get(AccountService);
	});

	after(async () => {
		await server.close();
		await nestApp.close();
		await orm.close();
	});

	const createRegistrationLinks = (requestParams, classId, role) =>
		qrRegistrationLinksLegacyService.create(
			{
				role,
				classId,
			},
			requestParams,
			app
		);

	describe('CREATE', () => {
		it('should return Forbidden when user without permission tries to generate registration links', async () => {
			const testUser = await testObjects.createTestUser();
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);
			try {
				await createRegistrationLinks(userRequestAuthentication, testUser._id);
				expect.fail('Forbidden expected');
			} catch (err) {
				expect(err.code).to.equal(403);
				expect(err.name).to.equal('Forbidden');
				expect(err.message).to.equal("You don't have one of the permissions: STUDENT_LIST, TEACHER_LIST.");
			}
		});

		it('should throw BadRequest if class does not belong user school', async () => {
			// given School A
			const { _id: schoolId } = await testObjects.createTestSchool();
			const testStudent1 = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const testStudent2 = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const testClass = await testObjects.createTestClass({ userIds: [testStudent1._id, testStudent2._id], schoolId });
			// given caller from School B
			const caller = await testObjects.createTestUser({ roles: ['teacher'] });
			const userRequestAuthentication = await generateRequestParamsFromUser(caller);

			try {
				await createRegistrationLinks(userRequestAuthentication, testClass._id);
				expect.fail('BadRequest expected');
			} catch (err) {
				expect(err.code).to.equal(400);
				expect(err.name).to.equal('BadRequest');
				expect(err.message).to.equal(`ClassId does match user's school`);
			}
		});

		it('should return registration link for all users from a class', async () => {
			const testStudent1 = await testObjects.createTestUser({ roles: ['student'] });
			const testStudent2 = await testObjects.createTestUser({ roles: ['student'] });
			const testClass = await testObjects.createTestClass({ userIds: [testStudent1._id, testStudent2._id] });
			const testUser = await testObjects.createTestUser({ roles: ['teacher'] });
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);

			const res = await createRegistrationLinks(userRequestAuthentication, testClass._id);
			expect(res.length).to.equal(2);
			expect(res.filter((result) => result.email === testStudent1.email).length).to.equal(1);
			expect(res.filter((result) => result.email === testStudent2.email).length).to.equal(1);
		});

		it('should return registration link for all users (from the caller school) with a role given (stundent)', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const callingUser = await testObjects.createTestUser({ roles: 'teacher', schoolId });
			const testUser1 = await testObjects.createTestUser({ roles: 'student', schoolId });
			const testUser2 = await testObjects.createTestUser({ roles: 'student', schoolId });
			const userRequestAuthentication = await generateRequestParamsFromUser(callingUser);
			const res = await createRegistrationLinks(userRequestAuthentication, undefined, 'student');
			expect(res.length).to.equal(2);
			expect(res.filter((result) => result.email === testUser1.email).length).to.equal(1);
			expect(res.filter((result) => result.email === testUser2.email).length).to.equal(1);
		});

		it('should return response in an expected form', async () => {
			const testUser = await testObjects.createTestUser({ roles: ['teacher'] });
			const testStudent2 = await testObjects.createTestUser({ roles: ['student'] });
			const testClass = await testObjects.createTestClass({ userIds: [testStudent2._id] });
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);
			const res = await createRegistrationLinks(userRequestAuthentication, testClass._id);
			expect(res.length).to.equal(1);
			const result = res[0];
			expect(result.firstName).to.equal(testStudent2.firstName);
			expect(result.lastName).to.equal(testStudent2.lastName);
			expect(result.email).to.equal(testStudent2.email);
			expect(result.hash).not.to.be.empty;
			expect(result.registrationLink.shortLink).not.to.be.empty;
		});
	});
});
