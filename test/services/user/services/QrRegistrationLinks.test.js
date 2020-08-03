const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);
const { generateRequestParamsFromUser, generateRequestParams } = require('../../helpers/services/login')(app);

const qrRegistrationLinksService = app.service('/users/qrRegistrationLink');
const accountService = app.service('accounts');

describe('qrRegistrationLinks service tests', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	const postRegistrationLinks = (requestParams, userIds) => qrRegistrationLinksService.create({
		userIds: userIds
	}, requestParams, app);

	describe('CREATE', () => {
		it('should return Forbidden when user without permission tries to generate registration links', async () => {
			const testUser = await testObjects.createTestUser();
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);
			return postRegistrationLinks(userRequestAuthentication, [testUser._id])
				.catch((err) => {
					expect(err.code)
						.to
						.equal(403);
					expect(err.name)
						.to
						.equal('Forbidden');
					expect(err.message)
						.to
						.equal('You don\'t have one of the permissions: STUDENT_LIST, TEACHER_LIST.');
				});
		});
		it('should return registration link for 1 user', async () => {
			const testUser = await testObjects.createTestUser({ roles: ['teacher'] });
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);
			return postRegistrationLinks(userRequestAuthentication, [testUser._id])
				.then((res) => {
					expect(res.length)
						.to
						.equal(1);
				});
		});
		it('should return registration link for 3 users', async () => {
			const testUser = await testObjects.createTestUser({ roles: ['teacher'] });
			const testUser2 = await testObjects.createTestUser();
			const testUser3 = await testObjects.createTestUser();
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);
			return postRegistrationLinks(userRequestAuthentication, [testUser._id, testUser2._id, testUser3._id])
				.then((res) => {
					expect(res.length)
						.to
						.equal(3);
				});
		});
		it('should return bad request if the id is invalid', async () => {
			const testUser = await testObjects.createTestUser({ roles: ['teacher'] });
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);
			return postRegistrationLinks(userRequestAuthentication, [testUser._id + 'some_invalid_id'])
				.catch((err) => {
					expect(err.code)
						.to
						.equal(400);
					expect(err.name)
						.to
						.equal('BadRequest');
					expect(err.message)
						.to
						.equal('Can not generate QR registration links');
				});
		});
		it('should return empty array if user already has an account', async () => {

			const user = await testObjects.createTestUser({ roles: 'teacher' });
			const credentials = {
				username: user.email,
				password: user.email
			};
			const testAccount = await testObjects.createTestAccount(credentials, null, user);
			const params = {
				...await generateRequestParams(credentials),
				query: {}
			};

			return postRegistrationLinks(params, [String(user._id)])
				.then((resp) => {
					expect(resp.length)
						.to
						.equal(0);
					accountService.remove(testAccount._id);
				});
		});
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});
});
