'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('account service', function () {
	it('registered the accounts service', () => {
		assert.ok(app.service('accounts'));
	});

	it('the account already exists', () => {
		const accountService = app.service('/accounts');

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
		const userService = app.service('/users');
		const accountService = app.service('/accounts');

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

	it('not able to access whole find', () => {
		const accountService = app.service('/accounts');

		return accountService.find()
			.catch(exception => {
				assert.equal(exception.message, 'Cannot read property \'username\' of undefined');
			});
	});
});
