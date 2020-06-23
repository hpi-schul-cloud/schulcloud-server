const { expect } = require('chai');
const app = require('../../../src/app');
const forcePasswordChangeService = app.service('forcePasswordChange');
const accountService = app.service('accounts');
const testObjects = require('../helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../helpers/services/login')(app);

describe('forceChangePassword service tests', () => {
	let server;
	const newPassword = 'SomePassword1!';
	const newPasswordConfirmation = 'SomePassword1!';
	const newPasswordThatDoesNotMatch = 'SomePassword2!';
	const newPasswordThatIsToWeak = 'SomePassword1';

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	const postChangePassword = (requestParams, password, password2) => forcePasswordChangeService.create({
		'password-1': password,
		'password-2': password2
	}, requestParams, app);

	describe('CREATE', () => {
		it('when the passwords do not match, the error object is returned with the proper error message', async () => {
			const testUser = await testObjects.createTestUser();
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);
			return postChangePassword(userRequestAuthentication, newPassword, newPasswordThatDoesNotMatch)
				.catch((err) => {
					expect(err.code)
						.to
						.equal(400);
					expect(err.name)
						.to
						.equal('BadRequest');
					expect(err.message)
						.to
						.equal('Die neuen Passwörter stimmen nicht überein.');
				});
		});
		it('when the password is to weak, the error object is returned with the proper error message', async () => {
			const testUser = await testObjects.createTestUser();
			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);
			return postChangePassword(userRequestAuthentication, newPasswordThatIsToWeak, newPasswordThatIsToWeak)
				.catch((err) => {
					expect(err.code)
						.to
						.equal(400);
					expect(err.name)
						.to
						.equal('BadRequest');
					expect(err.message)
						.to
						.equal('Dein Passwort stimmt mit dem Pattern nicht überein.');
				});
		});
		it('when the user has been forced to change his password, the proper flag will be setted after changing the password', async () => {
			const testUser = await testObjects.createTestUser();
			const teacherRequestAuthentication = await generateRequestParamsFromUser(testUser);

			const newAccount = {
				username: 'someusername',
				password: '$2a$10$wMuk7hpjULOEJrTW/CKtU.lIETKa.nEs8fncqLJ74SMeX.fzJACla',
				activated: true,
				createdAt: '2017-09-04T12:51:58.49Z',
				forceChangePassword: true,
			};
			const savedUser = await testObjects.createTestUser();
			const account = await testObjects.createTestAccount(newAccount, null, savedUser);
			const requestParams = teacherRequestAuthentication;
			requestParams.authentication.payload = {
				accountId: newAccount.accountId
			};

			return postChangePassword(requestParams, newPassword, newPasswordConfirmation)
				.then((resp) => {
					expect(resp.forceChangePassword).to.equal(false);
					accountService.remove(account._id);
				});
		});
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});
});
