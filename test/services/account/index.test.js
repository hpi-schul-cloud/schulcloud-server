'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const accountService = app.service('/accounts');
const userService = app.service('/users');
const registrationPinsService = app.service('/registrationPins');

let userId = undefined;
let accountId = undefined;
let passwordHash = undefined;
const accountPw = 'ca4t9fsfr3dsd';

describe('account service', function () {
	it('registered the accounts service', () => {
		assert.ok(app.service('accounts'));
	});

	it('the account already exists', () => {
		let accountObject = {
			username: "max" + Date.now() + "@mHuEsLtIeXrmann.de",
			password: accountPw,
			userId: "0000d213816abba584714c0a",
			
		};

		return accountService.create(accountObject)
			.catch(exception => {
				assert.equal(exception.message, 'Der Account existiert bereits!');
			});
	});

	it('create an account', () => {
		const prepareUser = function(userObject) {
			return registrationPinsService.create({"email": userObject.email})
				.then(registrationPin => {
					return registrationPinsService.find({
						query: { "pin": registrationPin.pin, "email": registrationPin.email, verified: false }
					});
				}).then(_ => {
					return userService.create(userObject);
				});
		};

		let userObject = {
			firstName: "Max",
			lastName: "Mustermann",
			email: "max" + Date.now() + "@mustermann.de",
			schoolId: "584ad186816abba584714c94"
		};

		return prepareUser(userObject)
			.then(user => {		
				let accountObject = {
					username: "max" + Date.now() + "@mHuEsLtIeXrmann.de",
					password: accountPw,
					userId: user._id
				};

				userId = user._id;

				assert.equal(user.lastName, userObject.lastName);

				return accountService.create(accountObject)
					.then(account => {
						accountId = account._id;
						passwordHash = account.password;
						assert.ok(account);
						assert.equal(account.username, accountObject.username.toLowerCase());
					});
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

	it('finds account by username', () => {
		return accountService.find({ query: {username: "admin@schul-cloud.org"}})
			.then(result => {
				assert(result.length == 1);
				assert.equal(result[0].username, "admin@schul-cloud.org");
				assert.equal(result[0]._id, "0000d213816abba584714caa");
			});
	});

	it('failed to patch password', () => {
		return accountService.patch('0000d213816abba584714c0a', { password: '1234'})
			.catch(exception => {
				assert.equal(exception.message, 'Dein Passwort stimmt mit dem Pattern nicht überein.');
			});
	});

	it('hash and verification mismatch', () => {
		return accountService.patch(accountId, { password: 'Schul&Cluedo76 ', password_verification: accountPw}, { account: {userId: '0000d213816abba584714c0b', password: '$2a$10$CHN6Qs2Igbn.s4BengUOfu9.0qVuy0uyTrzDDJszw9e1lBZwUFqeq' }})
			.catch(exception => {
				assert.equal(exception.message, 'Dein Passwort ist nicht korrekt!');
			});
	});

	it('successfully patch password', () => {
		return accountService.patch(accountId, { password: 'Schul&Cluedo76 ', password_verification: accountPw}, { account: {userId: userId, password: passwordHash }})
			.then(account => {
				assert.notEqual(account.password, passwordHash);
			});
	});

	it('successfully patch activated true', () => {
		return accountService.patch(accountId, {activated: true}, { account: {userId: userId }})
			.then(account => {
				assert.equal(account.activated, true);
			});
	});
});
