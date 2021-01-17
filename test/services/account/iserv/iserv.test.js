const chai = require('chai');
const chaiHttp = require('chai-http');
const { IservStrategy } = require('../../../../src/services/authentication/strategies');
const iservMockServer = require('./iservMockServer');
const config = require('./config');

chai.use(chaiHttp);
const { expect } = chai;

describe('IServ single-sign-on', function () {
	let mockSystem = null;

	function createIServMockServer() {
		return iservMockServer();
	}

	before(() =>
		createIServMockServer().then((iserv) => {
			mockSystem = {
				url: iserv.url,
				oaClientId: 'test',
				oaClientSecret: 'test',
			};
		})
	);

	it('should succeed when input with correct credentials', () => {
		const loginService = new IservStrategy();
		const { username, password } = config.testIServUser;
		return loginService.credentialCheck(username, password, mockSystem).then((response) => {
			const _res = response;
			expect(_res).to.be.not.undefined;
			expect(_res.data.statusCode).to.equal('200');
		});
	});

	it('should fail when input wrong user credentials', () => {
		const loginService = new IservStrategy();
		const { username, password } = config.testIServUserFail;
		return loginService.credentialCheck(username, password, mockSystem).catch((err) => {
			const body = JSON.parse(err.body);
			expect(body.statusCode).to.equal('401');
		});
	});
});
