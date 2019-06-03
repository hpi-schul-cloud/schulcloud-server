

const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = require('assert');
const promisify = require('es6-promisify');
const IServStrategy = require('../../../../src/services/account/strategies/iserv.js');
const iservMockServer = require('./iservMockServer');
const config = require('./config');
const should = require('chai').should();
const { expect } = require('chai');

chai.use(chaiHttp);

describe('IServ single-sign-on', function () {
	this.timeout(5000);

	let mockSystem = null;

	function createIServMockServer() {
		return iservMockServer();
	}

	before(() => createIServMockServer()
		.then((iserv) => {
			mockSystem = {
				url: iserv.url,
				oaClientId: 'test',
				oaClientSecret: 'test',
			};
		}));

	it('should succeed when input with correct credentials', () => {
		const loginService = new IServStrategy();
		return loginService.login(config.testIServUser, mockSystem)
			.then((response) => {
				const _res = response;
				expect(_res).to.be.not.undefined;
				expect(_res.data.statusCode).to.equal('200');
			});
	});

	it('should fail when input wrong user credentials', () => {
		const loginService = new IServStrategy();
		return loginService.login(config.testIServUserFail, mockSystem)
			.catch((err) => {
				const body = JSON.parse(err.body);
				expect(body.statusCode).to.equal('401');
			});
	});
});
