'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const accountService = app.service('/accounts');
const userService = app.service('/users');
/*
describe('account service', function () {
	it('registered the accounts service', () => {
		assert.ok(app.service('accounts'));
	});

	it('the account already exists', () => {
		let accountObject = {
			username: "max" + Date.now() + "@mHuEsLtIeXrmann.de",
			password: "ca4t9fsfr3dsd",
			userId: "0000d213816abba584714c0a"
		};

		return accountService.create(accountObject)
			.catch(exception => {
				assert.equal(exception.message, 'Der Account existiert bereits!');
			});
	});

	it('create an account', () => {
		let userObject = {
			firstName: "Max",
			lastName: "Mustermann",
			email: "max" + Date.now() + "@mustermann.de",
			schoolId: "584ad186816abba584714c94"
		};

		return userService.create(userObject)
			.then(user => {
				let accountObject = {
					username: "max" + Date.now() + "@mHuEsLtIeXrmann.de",
					password: "ca4t9fsfr3dsd",
					userId: user._id
				};

				assert.equal(user.lastName, userObject.lastName);

				return accountService.create(accountObject)
					.then(account => {
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
});
*/
