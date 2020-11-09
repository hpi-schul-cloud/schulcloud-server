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

	describe('API tests', () => {
		it('When an authorized user deletes a student and returns success', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const token = await testObjects.generateJWTFromUser(user);
			const request = chai
				.request(app)
				.delete(`/users/v2/users/${user._id}`)
				.set('Accept', 'application/json')
				.set('Authorization', token)
				.set('content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(200);
			expect(response.body).to.deep.equal({ success: true });
		});

		it('Returns error is user not found', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const notFoundId = ObjectId();
			const token = await testObjects.generateJWTFromUser(user);
			const request = chai
				.request(app)
				.delete(`/users/v2/users/${notFoundId}`)
				.set('Accept', 'application/json')
				.set('Authorization', token)
				.set('content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(404);
		});
	});
});
