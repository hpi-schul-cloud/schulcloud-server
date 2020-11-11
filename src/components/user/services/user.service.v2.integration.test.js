const chai = require('chai');
const chaiHttp = require('chai-http');
const { ObjectId } = require('mongoose').Types;
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);

chai.use(chaiHttp);
const { expect } = chai;

describe('user service v2', function test() {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
	});

	const getAdminToken = async (schoolId = undefined) => {
		const adminUser = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
		const credentials = { username: adminUser.email, password: `${Date.now()}` };
		await testObjects.createTestAccount(credentials, 'local', adminUser);
		const token = await testObjects.generateJWT(credentials);
		return token;
	};

	describe('API tests', () => {
		it('When an authorized user deletes a student and returns success', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const token = await getAdminToken(schoolId);
			const request = chai
				.request(app)
				.delete(`/users/v2/users/${user._id.toString()}`)
				.query({ userId: user._id.toString() })
				.set('Accept', 'application/json')
				.set('Authorization', token)
				.set('Content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(200);
			expect(response.body).to.deep.equal({ success: true });
		});

		it('Fails when not authorized user deletes a student', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			// const params = await testObjects.generateRequestParamsFromUser(admin);
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const token = await testObjects.generateJWTFromUser(teacher);
			const request = chai
				.request(app)
				.delete(`/users/v2/users/${user._id.toString()}`)
				.query({ userId: user._id.toString() })
				.set('Accept', 'application/json')
				.set('Authorization', token)
				.set('Content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(403);
		});

		it('Returns error is user not found', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const notFoundId = ObjectId();
			const token = await getAdminToken(schoolId);
			const request = chai
				.request(app)
				.delete(`/users/v2/users/${notFoundId.toString()}`)
				.query({ userId: notFoundId.toString() })
				.set('Accept', 'application/json')
				.set('Authorization', token)
				.set('Content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(404);
		});

		it('Fails when user from different deletes a student', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const { _id: otherSchoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const token = await getAdminToken(otherSchoolId);
			const request = chai
				.request(app)
				.delete(`/users/v2/users/${user._id.toString()}`)
				.query({ userId: user._id.toString() })
				.set('Accept', 'application/json')
				.set('Authorization', token)
				.set('Content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(403);
		});
	});
});
