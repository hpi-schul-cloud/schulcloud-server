const chai = require('chai');
const { default: chaiHttp, request } = require('chai-http');
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
		await testObjects.cleanup();
		await server.close();
		Configuration.reset(configBefore);
		await closeNestServices(nestServices);
	});

	const getAdminToken = async (schoolId = undefined) => {
		const adminUser = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
		const requestParams = await testObjects.generateRequestParamsFromUser(adminUser);

		return requestParams.authentication.accessToken;
	};

	it('POST succeeds valid request', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const token = await getAdminToken(schoolId);
		const req = request
			.execute(app)
			.post('/users/admin/students')
			.set('Accept', 'application/json')
			.set('Authorization', token)
			.set('content-type', 'application/json');
		const response = await req.send({
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
		const req = request
			.execute(app)
			.post('/users/admin/students')
			.set('Accept', 'application/json')
			.set('Authorization', token)
			.set('content-type', 'application/json');
		const response = await req.send({
			lastName: 'moritz',
			firstName: 'mustermann',
			schoolId,
			email: `${Date.now()}missingat.de`, // should fail
		});
		expect(response).to.not.be.undefined;
		expect(response.error).to.not.be.undefined;
		expect(response.error.status).to.equal(400);
	});

	const patchUserOfOtherSchool = async (route, role) => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const { _id: otherSchoolId } = await testObjects.createTestSchool();
		const token = await getAdminToken(schoolId);
		const user = await testObjects.createTestUser({ roles: [role], schoolId: otherSchoolId });
		await testObjects.createTestAccount({ username: user.email, password: 'password' }, null, user);

		const response = await request
			.execute(app)
			.patch(`/users/admin/${route}/${user._id}`)
			.set('Accept', 'application/json')
			.set('Authorization', token)
			.set('content-type', 'application/json')
			.send({
				firstName: 'Anne',
				lastName: 'Monkey',
				email: `${Date.now()}@test.de`,
			});

		expect(response.status).to.equal(404);
		expect(response.body.message).to.equal(`no record found for id '${user._id}'`);
		const notUpdatedUser = await app.service('usersModel').get(user._id);
		expect(notUpdatedUser.email).to.equal(user.email);
		expect(notUpdatedUser.firstName).to.equal(user.firstName);
		const account = await app.service('nest-account-service').findByUserId(user._id.toString());
		expect(account.username).to.equal(user.email);
	};

	it('PATCH fails for students of another school', () => patchUserOfOtherSchool('students', 'student'));

	it('PATCH fails for teachers of another school', () => patchUserOfOtherSchool('teachers', 'teacher'));
});
