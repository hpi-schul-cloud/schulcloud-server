import { expect } from 'chai';
import appPromise from '../../../../src/app';
import testObjectsImport from '../../helpers/testObjects'; 
const testObjects = testObjectsImport(appPromise);
import loginImport from '../../helpers/services/login'; 
const { generateRequestParamsFromUser, generateRequestParams } = loginImport(appPromise);

describe('qrRegistrationLinks service tests', () => {
	let app;
	let qrRegistrationLinksService;
	let accountService;
	let server;

	before(async () => {
		app = await appPromise;
		qrRegistrationLinksService = app.service('/users/qrRegistrationLink');
		accountService = app.service('accounts');
		server = await app.listen(0);
	});

	after((done) => {
		server.close(done);
	});

	const postRegistrationLinks = (requestParams, userIds, roleName = 'teacher', selectionType = 'inclusive') =>
		qrRegistrationLinksService.create(
			{
				userIds,
				roleName,
				selectionType,
			},
			requestParams,
			app
		);

	describe('CREATE', () => {
		it('should return Forbidden when user without permission tries to generate registration links', async () => {
			const testUser = await testObjects.createTestUser();
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);

			try {
				await postRegistrationLinks(userRequestAuthentication, [testUser._id]);
				expect.fail('Forbidden exception expected');
			} catch (err) {
				expect(err.code).to.equal(403);
				expect(err.name).to.equal('Forbidden');
				expect(err.message).to.equal("You don't have one of the permissions: STUDENT_LIST, TEACHER_LIST.");
			}
		});
		it('should return registration link for 1 user', async () => {
			const testUser = await testObjects.createTestUser({ roles: ['teacher'] });
			const testUser1 = await testObjects.createTestUser({ roles: ['student'] });
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);
			const res = await postRegistrationLinks(userRequestAuthentication, [testUser1._id], 'student');
			expect(res.length).to.equal(1);
		});
		it('should return registration link for 3 users', async () => {
			const testUser = await testObjects.createTestUser({ roles: ['teacher'] });
			const testUser2 = await testObjects.createTestUser({ roles: ['teacher'] });
			const testUser3 = await testObjects.createTestUser({ roles: ['teacher'] });
			const testUser4 = await testObjects.createTestUser({ roles: ['teacher'] });
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);
			const res = await postRegistrationLinks(userRequestAuthentication, [testUser2._id, testUser3._id, testUser4._id]);
			expect(res.length).to.equal(3);
		});
		it('should return bad request if the id is invalid', async () => {
			const testUser = await testObjects.createTestUser({ roles: ['teacher'] });
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);
			try {
				await postRegistrationLinks(userRequestAuthentication, [`${testUser._id}_some_invalid_id`]);
				expect.fail('BadRequest expected!');
			} catch (err) {
				expect(err.code).to.equal(400);
				expect(err.name).to.equal('BadRequest');
				expect(err.message).to.equal('Can not generate QR registration links');
			}
		});
		it('should return empty array if user already has an account', async () => {
			const user = await testObjects.createTestUser({ roles: 'teacher' });
			const credentials = {
				username: user.email,
				password: user.email,
			};
			const testAccount = await testObjects.createTestAccount(credentials, null, user);
			const params = {
				...(await generateRequestParams(credentials)),
				query: {},
			};

			const resp = await postRegistrationLinks(params, [String(user._id)]);
			expect(resp.length).to.equal(0);
			await accountService.remove(testAccount._id);
		});

		it('should return registration link for all users (from the caller school) with a role given (stundent)', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const callingUser = await testObjects.createTestUser({ roles: 'teacher', schoolId });
			const testUser1 = await testObjects.createTestUser({ roles: 'student', schoolId, firstName: 'register1' });
			const testUser2 = await testObjects.createTestUser({ roles: 'student', schoolId, firstName: 'register2' });
			const userRequestAuthentication = await generateRequestParamsFromUser(callingUser);
			const res = await postRegistrationLinks(userRequestAuthentication, [], 'student', 'exclusive');
			expect(res.length).to.equal(2);
			expect(res.filter((result) => result.firstName === testUser1.firstName).length).to.equal(1);
			expect(res.filter((result) => result.firstName === testUser2.firstName).length).to.equal(1);
		});

		it('should return registration link for all users (from the caller school) with a role given (teacher)', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const callingUser = await testObjects.createTestUser({ roles: 'administrator', schoolId });
			const testUser1 = await testObjects.createTestUser({ roles: 'teacher', schoolId, firstName: 'TeacherRegister1' });
			const testUser2 = await testObjects.createTestUser({ roles: 'teacher', schoolId, firstName: 'TeacherRegister2' });
			const userRequestAuthentication = await generateRequestParamsFromUser(callingUser);
			// when
			const res = await postRegistrationLinks(userRequestAuthentication, [], 'teacher', 'exclusive');
			// then
			expect(res.length).to.equal(2);
			expect(res.filter((result) => result.firstName === testUser1.firstName).length).to.equal(1);
			expect(res.filter((result) => result.firstName === testUser2.firstName).length).to.equal(1);
		});

		it('should return bad request for unsuported role given (other than student or teacher)', async () => {
			const testUser = await testObjects.createTestUser({ roles: ['teacher'] });
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);

			try {
				await postRegistrationLinks(userRequestAuthentication, [], 'admin');
				expect.fail('BadRequest expected');
			} catch (err) {
				expect(err.code).to.equal(400);
				expect(err.name).to.equal('BadRequest');
				expect(err.message).to.equal('Can not generate QR registration links');
				expect(err.errors.message).to.equal('The given role is not supported');
			}
		});
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});
});
