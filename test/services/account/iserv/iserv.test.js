'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = require('assert');
const promisify = require('es6-promisify');
const IServStrategy = require('../../../../src/services/account/strategies/iserv.js');
const iservMockServer = require('./iservMockServer');
const config = require('./config');
let should = require('chai').should();
let expect = require('chai').expect;
chai.use(chaiHttp);

describe('IServ single-sign-on', function () {

	this.timeout(5000);

	let mockSystem = null;

	function createIServMockServer() {
		return iservMockServer();
	}

	before(function () {
		return createIServMockServer()
			.then(iserv => {
				mockSystem = {
					url: iserv.url,
					oaClientId: 'test',
					oaClientSecret: 'test'
				};
			});
	});

	it('should succeed when input with correct credentials', function () {
		let loginService = new IServStrategy();
		return loginService.login(config.testIServUser, mockSystem)
			.then((response) => {
				var _res = response;
				expect(_res).to.be.not.undefined;
				expect(_res.data.statusCode).to.equal('200');
			});
	});

	it('should fail when input wrong user credentials', function () {
		let loginService = new IServStrategy();
		return loginService.login(config.testIServUserFail, mockSystem)
			.catch((err) => {
				let body = JSON.parse(err.body);
				expect(body.statusCode).to.equal('401');
			});
	});
});
