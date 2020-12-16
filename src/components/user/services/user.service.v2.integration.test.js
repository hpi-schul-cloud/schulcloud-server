const chai = require('chai');
const chaiHttp = require('chai-http');
const { ObjectId } = require('mongoose').Types;
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);

chai.use(chaiHttp);
const { expect } = chai;

describe.only('user service v2', function test() {
	let app;
	let server;
	let accountModelService;
	let usersModelService;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
		accountModelService = app.service('accountModel');
		usersModelService = app.service('usersModel');
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

	const getPermissionToken = async (schoolId, permissions = []) => {
		const currentUserRole = `currentUserPermission`;
		await testObjects.createTestRole({
			name: currentUserRole,
			permissions,
		});
		const currentUser = await testObjects.createTestUser({
			firstName: 'deleteUser',
			roles: [currentUserRole],
			schoolId,
		});
		const credentials = { username: currentUser.email, password: `${Date.now()}` };
		await testObjects.createTestAccount(credentials, 'local', currentUser);
		const token = await testObjects.generateJWT(credentials);
		return token;
	};

	describe('API tests', () => {
		it('When an admin deletes a student, then it succeeds', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const token = await getAdminToken(schoolId);
			const request = chai
				.request(app)
				.delete(`/users/v2/admin/student/${user._id.toString()}`)
				.query({ userId: user._id.toString() })
				.set('Accept', 'application/json')
				.set('Authorization', token)
				.set('Content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(204);
		});

		it('When an admin deletes a teacher, then it succeeds', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const token = await getAdminToken(schoolId);
			const request = chai
				.request(app)
				.delete(`/users/v2/admin/teacher/${user._id.toString()}`)
				.query({ userId: user._id.toString() })
				.set('Accept', 'application/json')
				.set('Authorization', token)
				.set('Content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(204);
		});

		it('when a teacher deletes a student, then it throws Forbidden', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			// const params = await testObjects.generateRequestParamsFromUser(admin);
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const token = await testObjects.generateJWTFromUser(teacher);
			const request = chai
				.request(app)
				.delete(`/users/v2/admin/student/${user._id.toString()}`)
				.query({ userId: user._id.toString() })
				.set('Accept', 'application/json')
				.set('Authorization', token)
				.set('Content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(403);
		});

		it('when an admin deletes a non-existing user, then it throws Not-Found', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const notFoundId = ObjectId();
			const token = await getAdminToken(schoolId);
			const request = chai
				.request(app)
				.delete(`/users/v2/admin/student/${notFoundId.toString()}`)
				.query({ userId: notFoundId.toString() })
				.set('Accept', 'application/json')
				.set('Authorization', token)
				.set('Content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(404);
		});

		it('when an admin deletes a student from a different school, then it throws Not-Found', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const { _id: otherSchoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const token = await getAdminToken(otherSchoolId);
			const request = chai
				.request(app)
				.delete(`/users/v2/admin/student/${user._id.toString()}`)
				.query({ userId: user._id.toString() })
				.set('Accept', 'application/json')
				.set('Authorization', token)
				.set('Content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(403);
		});

		it('when a user with STUDENT_DELETE permission deletes a student, then it succeeds', async () => {
			const school = await testObjects.createTestSchool({
				name: 'testSchool',
			});
			const { _id: schoolId } = school;

			const token = await getPermissionToken(schoolId, ['STUDENT_DELETE']);

			const deleteUser = await testObjects.createTestUser({ roles: ['student'], schoolId });

			const request = chai
				.request(app)
				.delete(`/users/v2/admin/student/${deleteUser._id.toString()}`)
				.set('Accept', 'application/json')
				.set('Authorization', token)
				.set('Content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(204);

			const checkUser = await usersModelService.get(deleteUser._id);
			expect(checkUser.fullName).to.equal('DELETED USER');

			const checkAccount = await accountModelService.find({ query: { userId: deleteUser._id }, paginate: false });
			expect(checkAccount.length).to.equal(0);
		});

		it('when a user with STUDENT_DELETE permission deletes a teacher, then it throws Forbidden', async () => {
			const school = await testObjects.createTestSchool({
				name: 'testSchool',
			});
			const { _id: schoolId } = school;

			const token = await getPermissionToken(schoolId, ['STUDENT_DELETE']);

			const deleteUser = await testObjects.createTestUser({ roles: ['teacher'], schoolId });

			const request = chai
				.request(app)
				.delete(`/users/v2/admin/teacher/${deleteUser._id.toString()}`)
				.set('Accept', 'application/json')
				.set('Authorization', token)
				.set('Content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(403);
		});
	});
});
