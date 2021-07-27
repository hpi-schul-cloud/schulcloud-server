/* eslint-disable no-unused-expressions */
/* eslint-disable max-len */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

const { expect } = chai;
chai.use(chaiAsPromised);

const appPromise = require('../../../../../src/app');
const { createTestUser, createTestAccount, cleanup } = require('../../../helpers/testObjects')(appPromise);

const util = require('../../../../../src/services/activation/utils/generalUtils');
const customUtils = require('../../../../../src/services/activation/utils/customStrategyUtils');

const mockData = {
	keyword: customUtils.KEYWORDS.E_MAIL_ADDRESS,
	email: 'testmail@schul-cloud.org123',
};

describe('activation/services/eMailAddress EMailAdresseActivationService', () => {
	let app;
	let server;
	let activationService;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
		activationService = app.service(`activation/${mockData.keyword}`);
	});

	after(async () => {
		await cleanup();
		await server.close();
	});

	it('registered the activation service', () => {
		expect(activationService).to.not.be.undefined;
	});

	it('create entry', async () => {
		const user = await createTestUser({ roles: ['student'] });
		const password = 'password123';
		const credentials = { username: user.email, password };
		await createTestAccount(credentials, 'local', user);

		const data = {
			email: mockData.email,
			repeatEmail: mockData.email,
			password,
		};

		const nestMailService = { send: sinon.spy() };
		app.services['nest-mail'] = nestMailService;

		const res = await activationService.create(data, { account: { userId: user._id } });
		expect(nestMailService.send.calledOnce).to.eql(true);
		expect(res.success).to.be.true;

		const entries = await util.getEntriesByUserId(app, user._id);
		expect(entries).to.have.lengthOf(1);
		expect(entries[0].quarantinedObject).to.be.equal(data.email);
		expect(entries[0].keyword).to.be.equal(mockData.keyword);
		expect(entries[0].userId.toString()).to.be.equal(user._id.toString());
	});
});
