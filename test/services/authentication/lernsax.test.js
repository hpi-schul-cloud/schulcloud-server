'use strict';

const chai = require('chai');
const assert = require('assert');
const promisify = require("es6-promisify");
const LernsaxLoginStrategy = require('../../../src/services/authentication/strategies/lernsax.js');
let should = chai.should();
let expect = chai.expect;

describe('Lernsax single-sign-on', function() {
	const testLernSaxUserFail = {
		username: 'username',
		password: 'password'
	};

	const testLernSaxUser = {
		username: 'nils.karn@fmsh.lernsax.de',
		password: 'schul-cloud'
	};

	it('should succeed when input with correct credentials', function() {
		this.timeout(5000);
		var loginService = new LernsaxLoginStrategy();
		return loginService.login(testLernSaxUser).then((response) => {
			var _res = response;
			expect(_res).to.be.not.undefined;
			expect(_res.success).to.be.true;
			expect(_res.username).to.equal(testLernSaxUser.username);
		});
	});

	it('should fail when input wrong user credentials', function() {
		this.timeout(5000);
		var loginService = new LernsaxLoginStrategy();
		return loginService.login(testLernSaxUserFail)
			.then(result => {
				expect(result).to.be.nil;
			})
			.catch((err) => {
			expect(err).to.equal('NotAuthenticated: wrong password');
		});
	});
});
