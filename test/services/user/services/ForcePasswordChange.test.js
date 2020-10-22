const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);
const { generateRequestParamsFromUser, generateRequestParams } = require('../../helpers/services/login')(appPromise);

describe('forcePasswordChange service tests', () => {
	let app;
	let accountService;
	let forcePasswordChangeService;
	let server;
	const newPassword = 'SomePassword1!';
	const newPasswordConfirmation = 'SomePassword1!';
	const newPasswordThatDoesNotMatch = 'SomePassword2!';
	const newPasswordThatIsToWeak = 'SomePassword1';

	before(async () => {
		app = await appPromise;
		accountService = app.service('accounts');
		forcePasswordChangeService = app.service('forcePasswordChange');
		server = await app.listen(0);
	});

	after((done) => {
		server.close(done);
	});

	const postChangePassword = (requestParams, password, password2) =>
		forcePasswordChangeService.create(
			{
				'password-1': password,
				'password-2': password2,
			},
			requestParams,
			app
		);

	describe('CREATE', () => {
		it('when the passwords do not match, the error object is returned with the proper error message', async () => {
			const testUser = await testObjects.createTestUser();
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);
			return postChangePassword(userRequestAuthentication, newPassword, newPasswordThatDoesNotMatch).catch((err) => {
				expect(err.code).to.equal(400);
				expect(err.name).to.equal('BadRequest');
				expect(err.message).to.equal('Die neuen Passwörter stimmen nicht überein.');
			});
		});
		it('when the password is to weak, the error object is returned with the proper error message', async () => {
			const testUser = await testObjects.createTestUser();
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);
			return postChangePassword(userRequestAuthentication, newPasswordThatIsToWeak, newPasswordThatIsToWeak).catch(
				(err) => {
					expect(err.code).to.equal(400);
					expect(err.name).to.equal('BadRequest');
					expect(err.message).to.equal('Can not update the password. Please contact the administrator');
				}
			);
		});
		// eslint-disable-next-line max-len
		it('when the user has been forced to change his password, the proper flag will be setted after changing the password', async () => {
			const testUser = await testObjects.createTestUser();
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);

			const newAccount = {
				username: 'someutestsername22@email.com',
				password: '$2a$10$wMuk7hpjULOEJrTW/CKtU.lIETKa.nEs8fncqLJ74SMeX.fzJACla',
				activated: true,
				createdAt: '2017-09-04T12:51:58.49Z',
				forcePasswordChange: true,
			};
			const savedUser = await testObjects.createTestUser();
			const account = await testObjects.createTestAccount(newAccount, null, savedUser);
			const requestParams = userRequestAuthentication;
			requestParams.authentication.payload = {
				accountId: newAccount.accountId,
			};

			return postChangePassword(requestParams, newPassword, newPasswordConfirmation).then((resp) => {
				expect(resp.forcePasswordChange).to.equal(false);
				accountService.remove(account._id);
			});
		});
		// eslint-disable-next-line max-len
		it('when the the user sets the password the same as the one specified by the admin, the proper error message will be shown', async () => {
			const testUser = await testObjects.createTestUser();
			const password = 'Schulcloud1!';
			await testObjects.createTestAccount({ username: testUser.email, password }, null, testUser);

			const userRequestAuthentication = await generateRequestParams({
				username: testUser.email,
				password,
			});
			return postChangePassword(userRequestAuthentication, password, password).catch((err) => {
				expect(err.code).to.equal(400);
				expect(err.name).to.equal('BadRequest');
				expect(err.message).to.equal('You need to setup your new unique password');
			});
		});
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});
});
