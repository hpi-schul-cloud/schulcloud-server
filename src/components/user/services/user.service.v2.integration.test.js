const chai = require('chai');
const chaiHttp = require('chai-http');
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
		it('When an authorized user delets a student, then stuff is happening (replace with useful test)', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const token = await testObjects.generateJWTFromUser(user);
			const request = chai
				.request(app)
				.delete('/users/v2/users')
				.set('Accept', 'application/json')
				.set('Authorization', token)
				.set('content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(200);
		});
	});
});
