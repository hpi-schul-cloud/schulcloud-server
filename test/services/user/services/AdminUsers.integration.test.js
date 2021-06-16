const chai = require('chai');
const chaiHttp = require('chai-http');
const commons = require('@hpi-schul-cloud/commons');

const { Configuration } = commons;

chai.use(chaiHttp);
const { expect } = chai;

describe('admin users integration tests', () => {
	let app;
	let server;
	let configBefore;
	let testObjects;

	before(async () => {
		delete require.cache[require.resolve('../../../../src/app')];
		configBefore = Configuration.toObject({ plainSecrets: true });
		Configuration.set('FEATURE_API_VALIDATION_ENABLED', true);
		// eslint-disable-next-line global-require
		const appPromise = require('../../../../src/app');
		// eslint-disable-next-line global-require
		testObjects = require('../../helpers/testObjects')(appPromise);
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
		Configuration.reset(configBefore);
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
			email: `${Date.now()}missingat.de`,
		});
		expect(response).to.not.be.undefined;
		expect(response.error).to.not.be.undefined;
		expect(response.error.status).to.equal(400);
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

	it('FIND basic request', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [adminUser] = await Promise.all([
			testObjects.createTestUser({ roles: ['administrator'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);

		const params = await testObjects.generateRequestParamsFromUser(adminUser);
		params.query = {
			$limit: 25,
			$skip: 0,
			$sort: {
				email: 1,
			},
		};

		const result = await app.service('/users/admin/students').find(params);
		expect(result).to.not.be.undefined;
		expect(result.data).to.be.an('array').of.length(3);
	});

	it('FIND request with searchQuery', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [adminUser] = await Promise.all([
			testObjects.createTestUser({ roles: ['administrator'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], firstName: 'Hannes', schoolId }),
			testObjects.createTestUser({ roles: ['student'], firstName: 'Hannelore', schoolId }),
			testObjects.createTestUser({ roles: ['student'], firstName: 'Max', schoolId }),
		]);
		const params = await testObjects.generateRequestParamsFromUser(adminUser);
		params.query = {
			$limit: 25,
			$skip: 0,
			$sort: {
				email: 1,
			},
			searchQuery: 'Hann',
		};
		const result = await app.service('/users/admin/students').find(params);
		expect(result).to.not.be.undefined;
		expect(result.data).to.be.an('array').of.length(2);
	});

	it('FIND request with various query params', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [adminUser] = await Promise.all([
			testObjects.createTestUser({ roles: ['administrator'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], firstName: 'Bruce', lastName: 'Wayne', schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);

		const params = await testObjects.generateRequestParamsFromUser(adminUser);
		params.query = {
			consentStatus: { $in: ['ok', 'parentsAgreed', 'missing'] },
			firstName: 'Bruce',
			lastName: 'Wayne',
		};
		const result = await app.service('/users/admin/students').find(params);
		expect(result).to.not.be.undefined;
		expect(result.data).to.be.an('array').of.length(1);
	});
});
