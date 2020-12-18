import chai from 'chai';
import chaiHttp from 'chai-http';
import { IservStrategy } from '../../../../src/services/authentication/strategies';
import iservMockServer from './iservMockServer';
import config from './config';

chai.use(chaiHttp);
const { expect } = chai;

describe('IServ single-sign-on', function () {
	this.timeout(5000);

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
