'use strict';

const assert = require('assert');
const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;

const app = require('../../../src/app');
const accountService = app.service('/accounts');
const userService = app.service('/users');
const registrationPinsService = app.service('/registrationPins');

describe('account service', function () {
	it('registered the accounts service', () => {
		assert.ok(app.service('accounts'));
	});

	describe('Account creation', () => {
		it('should work', async () => {
			let userObject = {
				firstName: "Max",
				lastName: "Mustermann",
				email: "max" + Date.now() + "@mustermann.de",
				schoolId: "584ad186816abba584714c94"
			};

			const registrationPin = await registrationPinsService.create({
				email: userObject.email
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

			let accountObject = {
				username: "max" + Date.now() + "@mHuEsLtIeXrmann.de",
				password: "ca4t9fsfr3dsd",
				userId: user._id
			};

			const account = await accountService.create(accountObject);
			expect(account).to.not.equal(undefined);
			expect(account.username).to.equal(accountObject.username.toLowerCase());

			await accountService.remove(account._id);
			await userService.remove(user._id);
		});

		it('should fail if the account already exists', async () => {
			const accountDetails = {
				username: "max" + Date.now() + "@mHuEsLtIeXrmann.de",
				password: "ca4t9fsfr3dsd",
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
						reject(new Error('This call should fail because of an already existing user with the same username'));
					})
					.catch((err) => {
						expect(err.message).to.equal('Der Benutzername ist bereits vergeben!');
						resolve();
					});
			});

			await accountService.remove(existingAccount._id);
		});

		it('should convert the username to lowercase and trim whitespace', async () => {
			let accountDetails = {
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

	it('fail to patch userId', () => {
		return accountService.patch("0000d213816abba584714caa", { userId: "0000d186816abba584714c5e" })
			.catch(exception => {
				assert.equal(exception.message, 'Die userId kann nicht geändert werden.');
				assert.equal(exception.code, 403);
			});
	});

	it('not able to access whole find', () => {
		return accountService.find()
			.catch(exception => {
				assert.equal(exception.message, 'Cannot read property \'username\' of undefined');
			});
	});
});
