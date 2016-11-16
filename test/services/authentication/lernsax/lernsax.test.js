'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = require('assert');
const promisify = require('es6-promisify');
const LernsaxLoginStrategy = require('../../../../src/services/authentication/strategies/lernsax.js');
const lernsaxMockServer = require('./lernsaxMockServer');
const config = require('./config');
let should = require('chai').should();
let expect = require('chai').expect;
chai.use(chaiHttp);

describe('Lernsax single-sign-on', function() {

	let mockLernsax = null;

	function createLernsaxTestServer() {
		return lernsaxMockServer();
	}

	before(function () {
		return createLernsaxTestServer()
			.then(lernsax => {
				mockLernsax = lernsax;
			});
	});

	it('should succeed when input with correct credentials', function() {
		let mockSystem = mockLernsax.url.replace('http://', '');
		var loginService = new LernsaxLoginStrategy();
		return loginService.login(config.testLernSaxUser,
				mockSystem + `/webdav.php?username=${config.testLernSaxUser.username}&password=${config.testLernSaxUser.password}`). // not mandatory, just for the mock server
				then((response) => {
			var _res = response;
			expect(_res).to.be.not.undefined;
			expect(_res.success).to.be.true;
			expect(_res.username).to.equal(config.testLernSaxUser.username);
		});
	});

	it('should fail when input wrong user credentials', function() {
		let mockSystem = mockLernsax.url.replace('http://', '');
		var loginService = new LernsaxLoginStrategy();
		return loginService.login(config.testLernSaxUser,
				mockSystem + `/webdav.php?username=${config.testLernSaxUserFail.username}&password=${config.testLernSaxUserFail.password}`). // not mandatory, just for the mock server
				then((result) => {
				expect(result).to.be.nil;
			})
			.catch((err) => {
			expect(err).to.equal('NotAuthenticated: wrong password');
		});
	});
});
