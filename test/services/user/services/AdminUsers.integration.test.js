const chai = require('chai');
const chaiHttp = require('chai-http');
const commons = require('@hpi-schul-cloud/commons');

const { Configuration } = commons;
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');

const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise());

chai.use(chaiHttp);
const { expect } = chai;

describe('admin users integration tests', () => {
	let app;
	let nestServices;
	let server;
	let configBefore;

	before(async () => {
		delete require.cache[require.resolve('../../../../src/app')];
		configBefore = Configuration.toObject({ plainSecrets: true });
		Configuration.set('FEATURE_API_VALIDATION_ENABLED', true);
		app = await appPromise();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		await server.close();
		Configuration.reset(configBefore);
		await closeNestServices(nestServices);
	});

	const getAdminToken = async (schoolId = undefined) => {
		const adminUser = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
		const credentials = { username: adminUser.email, password: `${Date.now()}` };
		await testObjects.createTestAccount(credentials, 'local', adminUser);
		const token = await testObjects.generateJWT(credentials);
		return token;
	};

	it('POST succeeds valid request', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const token = await getAdminToken(schoolId);
		const request = chai
			.request(app)
			.post('/users/admin/students')
			.set('Accept', 'application/json')
			.set('Authorization', token)
			.set('content-type', 'application/json');
		const response = await request.send({
			lastName: 'max',
			firstName: 'mustermann',
			schoolId,
			email: `${Date.now()}@test.de`,
		});
		expect(response).to.not.be.undefined;
		expect(response.body).to.haveOwnProperty('_id');
	});

	it('POST fails with invalid email format', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const token = await getAdminToken(schoolId);
		const request = chai
			.request(app)
			.post('/users/admin/students')
			.set('Accept', 'application/json')
			.set('Authorization', token)
			.set('content-type', 'application/json');
		const response = await request.send({
			lastName: 'moritz',
			firstName: 'mustermann',
			schoolId,
			email: `${Date.now()}missingat.de`, // should fail
		});
		expect(response).to.not.be.undefined;
		expect(response.error).to.not.be.undefined;
		expect(response.error.status).to.equal(400);
	});
});
