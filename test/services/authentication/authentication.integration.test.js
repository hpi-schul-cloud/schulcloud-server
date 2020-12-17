const chai = require('chai');
const chaiHttp = require('chai-http');
const commons = require('@hpi-schul-cloud/commons');

const { Configuration } = commons;

chai.use(chaiHttp);
const { expect } = chai;

describe('authentication service integration tests', function test() {
	let app;
	let server;
	let configBefore;
	let testObjects;
	this.timeout(10000);

	before(async () => {
		delete require.cache[require.resolve('../../../src/app')];
		configBefore = Configuration.toObject({ plainSecrets: true });
		Configuration.set('FEATURE_API_VALIDATION_ENABLED', true);
		Configuration.set('FEATURE_API_RESPONSE_VALIDATION_ENABLED', true);
		// eslint-disable-next-line global-require
		const appPromise = require('../../../src/app');
		// eslint-disable-next-line global-require
		testObjects = require('../helpers/testObjects')(appPromise);
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
		Configuration.reset(configBefore);
	});

	describe('Login', () => {
		it('When a user sends valid local authentication details, then he recieves a jwt', async () => {
			const accountDetails = { username: `${Date.now()}poweruser@mail.schul.tech`, password: `password${Date.now()}` };
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			await testObjects.createTestAccount(accountDetails, null, user);
			const request = chai
				.request(app)
				.post('/authentication')
				.set('Accept', 'application/json')
				.set('content-type', 'application/json');
			const response = await request.send({
				strategy: 'local',
				username: accountDetails.username,
				password: accountDetails.password,
				foo: 'bar',
			});
			expect(response.status).to.equal(201);
			expect(response.body).to.haveOwnProperty('accessToken');
		});
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
