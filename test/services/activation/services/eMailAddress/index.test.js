/* eslint-disable no-unused-expressions */
/* eslint-disable max-len */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

const { expect } = chai;
chai.use(chaiAsPromised);

const appPromise = require('../../../../../src/app');
const { createTestUser, createTestAccount, cleanup } = require('../../../helpers/testObjects')(appPromise());
const { setupNestServices, closeNestServices } = require('../../../../utils/setup.nest.services');

const util = require('../../../../../src/services/activation/utils/generalUtils');
const customUtils = require('../../../../../src/services/activation/utils/customStrategyUtils');

const mockData = {
	keyword: customUtils.KEYWORDS.E_MAIL_ADDRESS,
	email: 'testmail@schul-cloud.org123',
};

describe('activation/services/eMailAddress EMailAdresseActivationService', () => {
	let app;
	let server;
	let nestServices;
	let activationService;

	before(async () => {
		app = await appPromise();
		server = await app.listen(0);
		activationService = app.service(`activation/${mockData.keyword}`);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		await cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	it('registered the activation service', () => {
		expect(activationService).to.not.be.undefined;
	});
});
