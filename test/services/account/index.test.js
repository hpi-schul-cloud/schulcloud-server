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

	it('not able to access whole find', () => {
		const accountService = app.service('/accounts');

		return accountService.find()
			.catch(exception => {
				assert.equal(exception.message, 'Cannot read property \'username\' of undefined');
			});
	});
});
