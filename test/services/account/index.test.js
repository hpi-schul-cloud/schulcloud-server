const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { ObjectId } = require('mongoose').Types;

const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);
const { generateRequestParams } = require('../helpers/services/login')(app);

const accountService = app.service('/accounts');
const userService = app.service('/users');
const registrationPinsService = app.service('/registrationPins');

chai.use(chaiHttp);

const { expect } = chai;

describe('Account Service', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after(async () => {
		await testObjects.cleanup();
		server.close();
		return Promise.resolve();
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
				schoolId: '0000d186816abba584714c5f',
			};

			const registrationPin = await registrationPinsService.create({
				email: userObject.email,
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
					accountService.create(accountDetails)
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
				accountService.create(newAccount)
					.then(() => {
						reject(new Error('This call should fail because '
                        + 'of an already existing user with the same username'));
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
					accountService.create(accountDetails)
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
			const user = await testObjects.createTestUser();
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
			const user = await testObjects.createTestUser({ firstLogin: true });
			const accountDetails = {
				username: 'some@user.de',
				password: 'ca4t9fsfr3dsd',
				userId: user._id,
			};
			const account = await accountService.create(accountDetails);
			try {
				const params = await generateRequestParams(accountDetails);
				await accountService.patch(account._id, {
					password: 'Schul&Cluedo76 ',
					password_verification: 'wrongpassword',
				}, params);
				throw new Error('This should not happen.');
			} catch (exception) {
				assert.equal(exception.message, 'Dein Passwort ist nicht korrekt!');
			} finally {
				await accountService.remove(account._id);
				await userService.remove(user._id);
			}
		});

		it('should successfully patch activated to true', async () => {
			let user = await testObjects.createTestUser();
			user = await testObjects.createTestUser();
			const accountDetails = {
				username: user.email,
				password: 'ca4t9fsfr3dsd',
				userId: user._id,
			};
			const account = await accountService.create(accountDetails);
			try {
				const result = await accountService.patch(account._id, {
					activated: true,
				}, {
					account: {
						userId: account.userId,
					},
				});
				assert.equal(result.activated, true);
			} finally {
				await accountService.remove(account._id);
			}
		});
	});

	describe('FIND route', () => {
		it('should not be able to find all accounts via empty query', () => accountService.find()
			.catch((exception) => {
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
			chai.request(app)
				.get('/accounts')
				.query({ username: { $gte: 0 } })
				.end((response, err) => {
					expect(err).to.have.status(400);
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
			chai.request(app)
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
			chai.request(app)
				.get('/accounts')
				.query({ username: { $gte: 0 } })
				.set('Authorization', token)
				.end((err) => {
					expect(err).to.have.status(200);
					done();
				});
		});
	});
});
