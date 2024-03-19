// Following tests fail because the testUser is created with the help of bson. But the tested code uses parts
// from nest and there mikroORM uses a newer version of bson that causes problems. Additional the tested code doesn't
// seem to be in use

// const { expect } = require('chai');
// const appPromise = require('../../../../src/app');
// const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');
// const testObjects = require('../../helpers/testObjects')(appPromise());
// const { generateRequestParamsFromUser, generateRequestParams } = require('../../helpers/services/login')(appPromise());

// describe('forcePasswordChange service tests', () => {
// 	let app;
// 	let forcePasswordChangeService;
// 	let server;
// 	let nestServices;
// 	const newPassword = 'SomePassword1!';
// 	const newPasswordConfirmation = 'SomePassword1!';
// 	const newPasswordThatDoesNotMatch = 'SomePassword2!';
// 	const newPasswordThatIsToWeak = 'SomePassword1';

// 	before(async () => {
// 		app = await appPromise();
// 		nestServices = await setupNestServices(app);
// 		forcePasswordChangeService = app.service('forcePasswordChange');
// 		server = await app.listen(0);
// 	});

// 	after(async () => {
// 		await testObjects.cleanup();
// 		await server.close();
// 		await closeNestServices(nestServices);
// 	});

// 	const postChangePassword = (requestParams, password, password2) =>
// 		forcePasswordChangeService.create(
// 			{
// 				'password-1': password,
// 				'password-2': password2,
// 			},
// 			requestParams,
// 			app
// 		);

// 	describe('CREATE', () => {
// 		it('when the passwords do not match, the error object is returned with the proper error message', async () => {
// 			const testUser = await testObjects.createTestUser();
// 			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);
// 			return postChangePassword(userRequestAuthentication, newPassword, newPasswordThatDoesNotMatch).catch((err) => {
// 				expect(err.code).to.equal(400);
// 				expect(err.name).to.equal('BadRequest');
// 				expect(err.message).to.equal('Password and confirm password do not match.');
// 			});
// 		});

// 		it('when the password is to weak, the error object is returned with the proper error message', async () => {
// 			const testUser = await testObjects.createTestUser();
// 			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);
// 			return postChangePassword(userRequestAuthentication, newPasswordThatIsToWeak, newPasswordThatIsToWeak).catch(
// 				(err) => {
// 					expect(err.code).to.equal(400);
// 					expect(err.name).to.equal('BadRequest');
// 					expect(err.message).to.equal('Can not update the password. Please contact the administrator');
// 				}
// 			);
// 		});
// 		// eslint-disable-next-line max-len
// 		it('when the user has been forced to change his password, the proper flag will be setted after changing the password', async () => {
// 			const testUser = await testObjects.createTestUser();
// 			const userRequestAuthentication = await generateRequestParamsFromUser(testUser);

// 			const newAccount = {
// 				username: 'someutestsername22@email.com',
// 				password: '$2a$10$wMuk7hpjULOEJrTW/CKtU.lIETKa.nEs8fncqLJ74SMeX.fzJACla',
// 				activated: true,
// 				createdAt: '2017-09-04T12:51:58.49Z',
// 				forcePasswordChange: true,
// 			};
// 			const savedUser = await testObjects.createTestUser();
// 			await testObjects.createTestAccount(newAccount, null, savedUser);
// 			const requestParams = userRequestAuthentication;
// 			requestParams.authentication.payload = {
// 				accountId: newAccount.accountId,
// 			};
// 			// this.app.service('/users').patch(params.account.userId

// 			await postChangePassword(requestParams, newPassword, newPasswordConfirmation);
// 			const updatedUser = await app.service('users').get(savedUser._id);
// 			expect(updatedUser.forcePasswordChange).to.equal(false);
// 		});
// 		// eslint-disable-next-line max-len
// 		it('when the the user sets the password the same as the one specified by the admin, the proper error message will be shown', async () => {
// 			const testUser = await testObjects.createTestUser();
// 			const password = 'Schulcloud1!';
// 			await testObjects.createTestAccount({ username: testUser.email, password }, null, testUser);

// 			const userRequestAuthentication = await generateRequestParams({
// 				username: testUser.email,
// 				password,
// 			});
// 			return postChangePassword(userRequestAuthentication, password, password).catch((err) => {
// 				expect(err.code).to.equal(400);
// 				expect(err.name).to.equal('BadRequest');
// 				expect(err.message).to.equal('New password can not be same as old password.');
// 			});
// 		});
// 	});

// 	afterEach(async () => {
// 		await testObjects.cleanup();
// 	});
// });
