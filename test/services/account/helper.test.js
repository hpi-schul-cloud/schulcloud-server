'use strict';

const expect = require('chai').expect;
const AccountHelper = require('../../../src/services/account/helper.js');
const app = require('../../../src/app');

describe('Username/Password Generator', () => {

	var createdUser;

	after(function () {
		var accountService = app.service('/accounts');
		return accountService.remove(createdUser._id);
	});

	it('should be able to generate a regex conform password', function() {
		var accountHelper = new AccountHelper(app).externals;
		var array = new Array;
		for (var i = 0; i < 200; i++) {
			var password = accountHelper.generatePassword();
			array.push(password);
			expect(password.length == 17).to.be.true;
		}
		expect(array.length == 200).to.be.true;
	});

	it('should be able to generate a valid username', function() {
		var accountHelper = new AccountHelper(app).externals;
		var accountService = app.service('/accounts');
		return accountService.create({username: 'test.test', firstName: 'test', lastName: 'test', email: 'test@test.test', systemId: '0000d186816abba584714c92', userId: '0000d213816abba584714c0a'})
			.then((response) => {
				createdUser = response;
				accountHelper.findUsername('test','test')
					.then((username) => {
						expect(username).to.be.not.undefined;
						expect(username == 'test.test1').to.be.true;
					});
			});
	});

	it('should be able to find the maximum number in an array', function() {
		var accountHelper = new AccountHelper(app).externals;
		var array = new Array;
		var highestNumberReal = 0;
		for (var i = 0; i < 200; i++) {
			var number = (Math.random() * 1000) + 1;
			(highestNumberReal < number) ? highestNumberReal = number : '';
			array.push(number);
		}
		expect(array.length == 200).to.be.true;
		var highestNumber = accountHelper.findMax(array);
		expect(highestNumber == highestNumberReal).to.be.real;
	});
});
