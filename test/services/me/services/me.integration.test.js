const chai = require('chai');
const chaiHttp = require('chai-http');
const commons = require('@hpi-schul-cloud/commons');
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise());

const { Configuration } = commons;

chai.use(chaiHttp);
const { expect } = chai;

describe('me service integration tests', function test() {
	let app;
	let server;
	let nestServices;
	let configBefore;
	this.timeout(10000);

	before(async () => {
		delete require.cache[require.resolve('../../../../src/app')];
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

	describe('API tests', () => {
		it('When user sends an authorized request, then the call returns successfully', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const token = await testObjects.generateJWTFromUser(user);
			const request = chai
				.request(app)
				.get('/me')
				.set('Accept', 'application/json')
				.set('Authorization', `Bearer ${token}`)
				.set('content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(200);
			expect(response.body).to.haveOwnProperty('_id');
		});
	});
});
