const chai = require('chai');
const chaiHttp = require('chai-http');
const commons = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise());
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');

const { Configuration } = commons;

chai.use(chaiHttp);
const { expect } = chai;

describe('authentication service integration tests', () => {
	let app;
	let server;
	let nestServices;
	let configBefore;

	before(async () => {
		delete require.cache[require.resolve('../../../src/app')];
		configBefore = Configuration.toObject({ plainSecrets: true });
		Configuration.set('FEATURE_API_VALIDATION_ENABLED', true);
		Configuration.set('FEATURE_API_RESPONSE_VALIDATION_ENABLED', true);
		app = await appPromise();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		await server.close();
		await closeNestServices(nestServices);
		Configuration.reset(configBefore);
	});

	describe('Logout', () => {
		it('When a user successfully removes his authentication, then he is logged out', async () => {
			const accountDetails = { username: `${Date.now()}poweruser@mail.schul.tech`, password: `password${Date.now()}` };
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const token = await testObjects.generateJWTFromUser(user);
			const request = chai
				.request(app)
				.delete('/authentication')
				.set('Accept', 'application/json')
				.set('Authorization', token)
				.set('content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(200);
			expect(response.body).to.haveOwnProperty('accessToken');
		});
	});
});
