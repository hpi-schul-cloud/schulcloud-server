const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { ObjectId } = require('mongoose').Types;

const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);
const { generateRequestParams, generateRequestParamsFromUser } = require('../../helpers/services/login')(appPromise);
const { validateUserName } = require('../../../../src/services/account/hooks');

chai.use(chaiHttp);

const { expect } = chai;

describe('Account Service', () => {
	let app;
	let userService;
	let registrationPinsService;
	let accountService;

	let server;

	before(async () => {
		app = await appPromise;
		accountService = app.service('/accounts');
		userService = app.service('/users');
		registrationPinsService = app.service('/registrationPins');
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	it('registered the accounts service', () => {
		assert.ok(app.service('accounts'));
	});

	describe('CREATE route', () => {
		it('should work', async () => {
			const userObject = {
				firstName: 'Max',
				lastName: 'Mustermann',
				email: `max${Date.now()}@mustermann.de`,
				schoolId: '5f2987e020834114b8efd6f8',
			};

			const registrationPin = await registrationPinsService.create({
				email: userObject.email,
				silent: true,
			});
			// verify registration pin:
			await registrationPinsService.find({
				query: {
					pin: registrationPin.pin,
					email: registrationPin.email,
					verified: false,
				},
			});
			const user = await userService.create(userObject);
			assert.equal(user.lastName, userObject.lastName);

			const accountObject = {
				username: `max${Date.now()}@mHuEsLtIeXrmann.de`,
				password: 'ca4t9fsfr3dsd',
				userId: user._id,
			};

			const account = await accountService.create(accountObject);
			expect(account).to.not.equal(undefined);
			expect(account.username).to.equal(accountObject.username.toLowerCase());

			await accountService.remove(account._id);
			await userService.remove(user._id);
		});

		it('should fail if the account already exists', async () => {
			const accountDetails = {
				username: `max${Date.now()}@mHuEsLtIeXrmann.de`,
				password: 'ca4t9fsfr3dsd',
				userId: new ObjectId(),
			};
			const account = await accountService.create(accountDetails);

			try {
				await new Promise((resolve, reject) => {
					accountService
						.create(accountDetails)
						.then(() => {
							reject(new Error('This call should fail because the user already exists'));
						})
						.catch((err) => {
							expect(err.message).to.equal('Der Account existiert bereits!');
							resolve();
						});
				});
			} finally {
				await accountService.remove(account._id);
			}
		});

		it('should fail for mixed-case variants of existing accounts', async () => {
			const existingAccountDetails = {
				username: 'existing@account.de',
				password: 'ca4t9fsfr3dsd',
				userId: new ObjectId(),
			};
			const existingAccount = await accountService.create(existingAccountDetails);

			const newAccount = {
				username: 'ExistIng@aCcount.de',
				password: 'po4t9fstr3gal',
				userId: new ObjectId(),
			};

			await new Promise((resolve, reject) => {
				accountService
					.create(newAccount)
					.then(() => {
						reject(new Error('This call should fail because ' + 'of an already existing user with the same username'));
					})
					.catch((err) => {
						expect(err.message).to.equal('Der Benutzername ist bereits vergeben!');
						resolve();
					});
			});

			await accountService.remove(existingAccount._id);
		});

		it('should convert the username to lowercase and trim whitespace', async () => {
			const accountDetails = {
				username: '  EXISTING@account.DE ',
				password: 'ca4t9fsfr3dsd',
				userId: new ObjectId(),
			};
			const account = await accountService.create(accountDetails);
			expect(account.username).to.equal(accountDetails.username.trim().toLowerCase());

			try {
				await new Promise((resolve, reject) => {
					accountDetails.userId = new ObjectId();
					accountService
						.create(accountDetails)
						.then(() => {
							reject(new Error('This call should fail because the user already exists'));
						})
						.catch((err) => {
							expect(err.message).to.equal('Der Benutzername ist bereits vergeben!');
							resolve();
						});
				});
			} finally {
				await accountService.remove(account._id);
			}
		});

		it('should return an error if invalid email format was provided', async () => {
			const accountDetails = {
				username: 'invalid_user_name',
				password: 'ca4t9fsfr3dsd',
				userId: new ObjectId(),
			};

			await new Promise((resolve, reject) => {
				accountDetails.userId = new ObjectId();
				accountService
					.create(accountDetails)
					.then(() => {
						reject(new Error('This call should fail because the user already exists'));
					})
					.catch((err) => {
						expect(err.message).to.not.equal('should have failed.');
						expect(err.code).to.equal(400);
						expect(err.message).to.equal('Invalid username. Username should be a valid email format');
						resolve();
					});
			});
		});
	});

	describe('UPDATE route', () => {
		it('should not accept external requests', async () => {
			const user = await testObjects.createTestUser({ firstLogin: true, roles: ['student'] });
			const otherUser = await testObjects.createTestUser({ roles: ['student'] });
			const accountDetails = {
				username: 'other@user.de',
				password: 'password',
				userId: otherUser._id,
			};
			const account = await accountService.create(accountDetails);
			try {
				const params = await generateRequestParamsFromUser(user);
				await accountService.update(
					account._id,
					{
						username: 'other@user.de',
						password: 'newpassword',
						userId: otherUser._id,
					},
					params
				);
				throw new Error('should have failed.');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed.');
				expect(err.code).to.equal(405);
				expect(err.message).to.equal("Provider 'rest' can not call 'update'. (disallow)");
			} finally {
				await accountService.remove(account._id);
				await userService.remove(user._id);
			}
		});
	});

	describe('PATCH route', () => {
		it('should not override userIds', async () => {
			const accountDetails = {
				username: 'some@user.de',
				password: 'ca4t9fsfr3dsd',
				userId: new ObjectId(),
			};
			const account = await accountService.create(accountDetails);
			try {
				await accountService.patch(account._id, { userId: new ObjectId() });
				throw new Error('This should not happen.');
			} catch (exception) {
				assert.equal(exception.message, 'Die userId kann nicht geändert werden.');
				assert.equal(exception.code, 403);
			} finally {
				await accountService.remove(account._id);
			}
		});

		it('should fail to patch the password if it does not meet requirements', async () => {
			const user = await testObjects.createTestUser({ roles: ['student'] });
			const accountDetails = {
				username: 'some@user.de',
				password: 'ca4t9fsfr3dsd',
				userId: user._id,
			};
			const account = await accountService.create(accountDetails);
			try {
				const params = await generateRequestParams(accountDetails);
				await accountService.patch(account._id, { password: '1234' }, params);
				throw new Error('This should not happen.');
			} catch (exception) {
				assert.equal(exception.message, 'Dein Passwort stimmt mit dem Pattern nicht überein.');
			} finally {
				await accountService.remove(account._id);
				await userService.remove(user._id);
			}
		});

		it('should fail on verification mismatch', async () => {
			const user = await testObjects.createTestUser({ firstLogin: true, roles: ['student'] });
			const accountDetails = {
				username: `some${new ObjectId()}@user.de`,
				password: 'ca4t9fsfr3dsd',
				userId: user._id,
			};
			const account = await accountService.create(accountDetails);
			try {
				const params = await generateRequestParams(accountDetails);
				await accountService.patch(
					account._id,
					{
						password: 'Schul&Cluedo76 ',
						password_verification: 'wrongpassword',
					},
					params
				);
				throw new Error('This should not happen.');
			} catch (exception) {
				expect(exception.message).to.equal('Dein Passwort ist nicht korrekt!');
			} finally {
				await accountService.remove(account._id);
				await userService.remove(user._id);
			}
		});

		it('should successfully patch activated to true', async () => {
			const user = await testObjects.createTestUser();
			const accountDetails = {
				username: user.email,
				password: 'ca4t9fsfr3dsd',
				userId: user._id,
			};
			const account = await accountService.create(accountDetails);
			try {
				const result = await accountService.patch(
					account._id,
					{
						activated: true,
					},
					{
						account: {
							userId: account.userId,
						},
					}
				);
				assert.equal(result.activated, true);
			} finally {
				await accountService.remove(account._id);
			}
		});

		it('user should fail to patch other user', async () => {
			const user = await testObjects.createTestUser({ firstLogin: true, roles: ['student'] });
			const otherUser = await testObjects.createTestUser({ roles: ['student'] });
			const accountDetails = {
				username: 'other@user.de',
				password: 'password',
				userId: otherUser._id,
			};
			const account = await accountService.create(accountDetails);
			try {
				const params = await generateRequestParamsFromUser(user);
				await accountService.patch(
					account._id,
					{
						password: 'Schul&Cluedo76',
						password_verification: 'Schul&Cluedo76',
					},
					params
				);
				throw new Error('should have failed.');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed.');
				expect(err.code).to.equal(400);
				expect(err.message).to.equal('You have not the permissions to change other users');
			} finally {
				await accountService.remove(account._id);
				await userService.remove(user._id);
			}
		});

		it('admin should fail to patch user on other school', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const { _id: otherSchoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
			const otherUser = await testObjects.createTestUser({ roles: ['student'], schoolId: otherSchoolId });
			const accountDetails = {
				username: 'other@user.de',
				password: 'password',
				userId: otherUser._id,
			};
			const account = await accountService.create(accountDetails);
			try {
				const params = await generateRequestParamsFromUser(user);
				await accountService.patch(
					account._id,
					{
						password: 'Schul&Cluedo76',
						password_verification: 'Schul&Cluedo76',
					},
					params
				);
				throw new Error('should have failed.');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed.');
				expect(err.code).to.equal(404);
				expect(err.message).to.equal('this account doesnt exist');
			} finally {
				await accountService.remove(account._id);
				await userService.remove(user._id);
			}
		});

		it('should return an error if invalid email format was provided', async () => {
			const user = await testObjects.createTestUser();
			const accountDetails = {
				username: user.email,
				password: 'ca4t9fsfr3dsd',
				userId: user._id,
			};
			const account = await accountService.create(accountDetails);
			try {
				await accountService.patch(account._id, {
					username: 'some_bad_email_address',
				});
			} catch (err) {
				expect(err.message).equal('Invalid username. Username should be a valid email format');
				expect(err.code).to.equal(400);
			} finally {
				await accountService.remove(account._id);
			}
		});

		it('should return account object with changed email address', async () => {
			const user = await testObjects.createTestUser();
			const accountDetails = {
				username: user.email,
				password: 'ca4t9fsfr3dsd',
				userId: user._id,
			};
			const account = await accountService.create(accountDetails);
			try {
				const result = await accountService.patch(account._id, {
					username: 'some_good@email.adderss',
				});
				expect(result.username).to.equal('some_good@email.adderss');
			} finally {
				await accountService.remove(account._id);
			}
		});

		it('should NOT return an error if user edits own username', async () => {
			const user = await testObjects.createTestUser();
			const accountDetails = {
				username: 'some_good@email.adderss',
				password: 'ca4t9fsfr3dsd',
				userId: user._id,
			};
			const account = await accountService.create(accountDetails);
			try {
				const result = await accountService.patch(account._id, {
					username: 'some_good@email.adderss',
				});
				expect(result.username).to.equal('some_good@email.adderss');
			} finally {
				await accountService.remove(account._id);
			}
		});

		it('should return an error if an username specified in the request body already exists', async () => {
			const user = await testObjects.createTestUser();
			const user2 = await testObjects.createTestUser();
			const accountDetails = {
				username: 'some_good@email.adderss',
				password: 'ca4t9fsfr3dsd',
				userId: user._id,
			};
			const accountDetails2 = {
				username: 'some_good_another@email.adderss',
				password: 'ca4t9fsfr3dsd',
				userId: user2._id,
			};
			const account = await accountService.create(accountDetails);
			const account2 = await accountService.create(accountDetails2);
			try {
				await accountService.patch(account._id, {
					username: 'some_good_another@email.adderss',
				});
				throw new Error('should have failed.');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed.');
				expect(err.message).equal('Der Benutzername ist bereits vergeben!');
				expect(err.code).to.equal(400);
			} finally {
				await accountService.remove(account._id);
				await accountService.remove(account2._id);
			}
		});

		it('should return an error if populate is specified in query params for a PATCH method', async () => {
			const user = await testObjects.createTestUser();
			const accountDetails = {
				username: user.email,
				password: 'ca4t9fsfr3dsd',
				userId: user._id,
			};

			const account = await accountService.create(accountDetails);
			try {
				const params = await generateRequestParams(accountDetails);
				params.query = { $populate: 'userId' };
				params.provider = 'rest';
				// params.username = 'some_goo@google.com';
				await accountService.patch(
					account._id,
					{
						password: 'Schulcloud1!',
					},
					params
				);
				throw new Error('should have failed.');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed.');
				expect(err.message).equal('populate not supported');
				expect(err.code).to.equal(400);
			} finally {
				await accountService.remove(account._id);
			}
		});
	});

	describe('REMOVE route', () => {
		it('should return an error if populate is specified in query params for a REMOVE method', async () => {
			const user = await testObjects.createTestUser({ roles: ['teacher'] });
			const accountDetails = {
				username: user.email,
				password: 'ca4t9fsfr3dsd',
				userId: user._id,
			};

			const account = await accountService.create(accountDetails);
			try {
				const params = await generateRequestParams(accountDetails);
				params.query = { $populate: 'userId' };
				params.provider = 'rest';
				// params.username = 'some_goo@google.com';
				await accountService.remove(account._id, params);
				throw new Error('should have failed.');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed.');
				expect(err.message).equal('populate not supported');
				expect(err.code).to.equal(400);
			}
		});
	});

	describe('FIND route', () => {
		it('should not be able to find all accounts via empty query', () =>
			accountService.find().catch((exception) => {
				assert.equal(exception.code, 400);
			}));

		it('should find accounts by username', async () => {
			const username = 'adam.admin@schul-cloud.org';
			const accountDetails = {
				username,
				password: 'ca4t9fsfr3dsd',
				userId: new ObjectId(),
			};
			const account = await accountService.create(accountDetails);
			try {
				const result = await accountService.find({ query: { username } });
				expect(result.length).to.equal(1);
				expect(result[0].username).to.equal(username);
				expect(result[0]._id).to.deep.equal(account._id);
			} finally {
				await accountService.remove(account._id);
			}
		});

		// todo extern request without superhero
		it('should filter querys for extern not authenticated requests', (done) => {
			chai
				.request(app)
				.get('/accounts')
				.query({ username: { $gte: 0 } })
				.end((response, err) => {
					expect(err).to.have.status(401);
					done();
				});
		});

		// todo extern request with superhero
		it.skip('should allow extern request for superhero with token', (done) => {
			// todo wait for test helpers
			// create superhero user
			// generate token for it
			// start request with token
			const token = '<token>';
			chai
				.request(app)
				.get('/accounts')
				.query({ username: { $gte: 0 } })
				.set('Authorization', token)
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					done();
				});
		});

		it.skip('should not allow extern request for other roles with token', (done) => {
			// todo wait for test helpers
			// create superhero user
			// generate token for it
			// start request with token
			const token = '<token>';
			chai
				.request(app)
				.get('/accounts')
				.query({ username: { $gte: 0 } })
				.set('Authorization', token)
				.end((err) => {
					expect(err).to.have.status(200);
					done();
				});
		});

		it('should not allow external request when the requester and the requested user are not from the same school', async () => {
			const school = await testObjects.createTestSchool({
				name: 'testSchool1',
			});
			const otherSchool = await testObjects.createTestSchool({
				name: 'testSchool2',
			});

			const student = await testObjects.createTestUser({ roles: ['student'], schoolId: school._id });
			const studentAccount = await testObjects.createTestAccount(
				{ username: student.email, password: student.email },
				undefined,
				student
			);

			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId: otherSchool._id });
			const params = await generateRequestParamsFromUser(user);

			expect(student.schoolId).to.not.equal(user.schoolId);

			try {
				await accountService.find({ ...params, query: { userId: studentAccount.userId } });
				expect.fail('The previous call should have failed');
			} catch (err) {
				expect(err.code).to.equal(403);
				expect(err.message).to.equal('You are not allowed to request this information');
			}
		});

		it('should allow external request when the requester and the requested user are from the same school', async () => {
			const student = await testObjects.createTestUser({ roles: ['student'] });
			const studentAccount = await testObjects.createTestAccount(
				{ username: student.email, password: student.email },
				undefined,
				student
			);

			const user = await testObjects.createTestUser({ roles: ['teacher'] });
			const params = await generateRequestParamsFromUser(user);

			expect(student.schoolId.toString()).to.equal(user.schoolId.toString());

			const requestedAccount = await accountService.find({ ...params, query: { userId: studentAccount.userId } });
			expect(requestedAccount[0].username).to.equal(student.email);
		});

		it('should not allow request when a userId is not included in the query', async () => {
			const user = await testObjects.createTestUser({ roles: ['teacher'] });
			const params = await generateRequestParamsFromUser(user);

			try {
				await accountService.find(params);
				expect.fail('The previous call should have failed');
			} catch (err) {
				expect(err.code).to.equal(400);
				expect(err.message).to.equal('Not allowed');
			}
		});

		it('should not allow request when a userId is not a valid objectId', async () => {
			const user = await testObjects.createTestUser({ roles: ['teacher'] });
			const params = await generateRequestParamsFromUser(user);

			try {
				await accountService.find({ ...params, query: { userId: 'not a valid object id' } });
				expect.fail('The previous call should have failed');
			} catch (err) {
				expect(err.code).to.equal(400);
				expect(err.message).to.equal('Not allowed');
			}
		});

		it('should allow external request when the requester is superhero and the requested user and superhero are not from the same school', async () => {
			const school = await testObjects.createTestSchool({
				name: 'testSchool1',
			});
			const otherSchool = await testObjects.createTestSchool({
				name: 'testSchool2',
			});

			const student = await testObjects.createTestUser({ roles: ['student'], schoolId: school._id });
			const studentAccount = await testObjects.createTestAccount(
				{ username: student.email, password: student.email },
				undefined,
				student
			);

			const user = await testObjects.createTestUser({ roles: ['superhero'], schoolId: otherSchool._id });
			const params = await generateRequestParamsFromUser(user);

			expect(student.schoolId).to.not.equal(user.schoolId);

			const requestedAccount = await accountService.find({ ...params, query: { userId: studentAccount.userId } });
			expect(requestedAccount[0].username).to.equal(student.email);
		});
	});

	describe('testing accounts hooks directly', () => {
		it('should validateUserName NOT throws an error when username is not email format and systemId is specified', async () => {
			const userObject = {
				firstName: 'Max',
				lastName: 'Mustermann',
				email: `max${Date.now()}@mustermann.de`,
				schoolId: '5f2987e020834114b8efd6f8',
			};

			const registrationPin = await registrationPinsService.create({
				email: userObject.email,
				silent: true,
			});
			// verify registration pin:
			await registrationPinsService.find({
				query: {
					pin: registrationPin.pin,
					email: registrationPin.email,
					verified: false,
				},
			});
			const user = await userService.create(userObject);
			const accountObject = {
				username: 'valid2@email.com',
				password: 'ca4t9fsfr3dsd',
				userId: user._id,
			};
			const account = await accountService.create(accountObject);
			const fakeContext = {
				app,
				data: {
					...accountObject,
					...{
						username: 'dc=schul-cloud,dc=org/fake.ldap',
						systemId: 'fake_system_id',
					},
				},
				id: account._id,
				method: 'create',
			};
			try {
				const contextFromHook = await validateUserName(fakeContext);
				expect(contextFromHook.data.username).to.equal(fakeContext.data.username);
			} catch (err) {
				expect(err.message).to.not.equal('should have failed.');
			} finally {
				await accountService.remove(account._id);
				await userService.remove(user._id);
			}
		});

		it('should validateUserName throws an error when username is NOT email format and systemId is NOT specified', async () => {
			const userObject = {
				firstName: 'Max',
				lastName: 'Mustermann',
				email: `max${Date.now()}@mustermann.de`,
				schoolId: '5f2987e020834114b8efd6f8',
			};

			const registrationPin = await registrationPinsService.create({
				email: userObject.email,
				silent: true,
			});
			// verify registration pin:
			await registrationPinsService.find({
				query: {
					pin: registrationPin.pin,
					email: registrationPin.email,
					verified: false,
				},
			});
			const user = await userService.create(userObject);
			const accountObject = {
				username: 'valid2@email.com',
				password: 'ca4t9fsfr3dsd',
				userId: user._id,
			};
			const account = await accountService.create(accountObject);
			const fakeContext = {
				app,
				data: {
					...accountObject,
					...{
						username: 'dc=schul-cloud,dc=org/fake.ldap',
					},
				},
				id: account._id,
				method: 'create',
			};
			try {
				await validateUserName(fakeContext);
				throw new Error('should have failed.');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed.');
				expect(err.message).to.equal('Invalid username. Username should be a valid email format');
			} finally {
				await accountService.remove(account._id);
				await userService.remove(user._id);
			}
		});
	});
});
