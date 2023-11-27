const chai = require('chai');
const chaiHttp = require('chai-http');
const { ObjectId } = require('mongoose').Types;
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects');
const { setupNestServices, closeNestServices } = require('../../../../test/utils/setup.nest.services');

chai.use(chaiHttp);
const { expect } = chai;

describe('user service v2', () => {
	let app;
	let server;
	let usersModelService;
	let nestServices;
	let testHelper;

	before(async () => {
		app = await appPromise();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);

		usersModelService = app.service('usersModel');
		testHelper = testObjects(app);
	});

	after(async () => {
		await server.close();
		await closeNestServices(nestServices);
	});

	afterEach(async () => {
		await testHelper.cleanup();
	});

	const getAuthToken = async (schoolId = undefined, role = 'administrator') => {
		const adminUser = await testHelper.createTestUser({ roles: [role], schoolId });
		const credentials = { username: adminUser.email, password: `${Date.now()}` };
		await testHelper.createTestAccount(credentials, 'local', adminUser);
		const token = await testHelper.generateJWT(credentials);
		return token;
	};

	const getPermissionToken = async (schoolId, permissions = []) => {
		const currentUserRole = `currentUserPermission`;
		await testHelper.createTestRole({
			name: currentUserRole,
			permissions,
		});
		const currentUser = await testHelper.createTestUser({
			firstName: 'deleteUser',
			roles: [currentUserRole],
			schoolId,
		});
		const credentials = { username: currentUser.email, password: `${Date.now()}` };
		await testHelper.createTestAccount(credentials, 'local', currentUser);
		const token = await testHelper.generateJWT(credentials);
		return token;
	};

	describe('API tests', () => {
		describe('delete', () => {
			describe('single user', () => {
				it('When an admin deletes a student, then it succeeds', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const user = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const token = await getAuthToken(schoolId);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/student/${user._id.toString()}`)
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(204);
				});

				it('When a superhero deletes a student, then it succeeds', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const { _id: schoolId2 } = await testHelper.createTestSchool();

					const user = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const token = await getAuthToken(schoolId2, 'superhero');
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/student/${user._id.toString()}`)
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(204);
				});

				it('When a superhero deletes a teacher, then it succeeds', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const { _id: schoolId2 } = await testHelper.createTestSchool();

					const user = await testHelper.createTestUser({ roles: ['teacher'], schoolId });
					const token = await getAuthToken(schoolId2, 'superhero');
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/teacher/${user._id.toString()}`)
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(204);
				});

				it('When a superhero deletes a admin, then it succeeds', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const { _id: schoolId2 } = await testHelper.createTestSchool();

					const user = await testHelper.createTestUser({ roles: ['administrator'], schoolId });
					const token = await getAuthToken(schoolId2, 'superhero');
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/administrator/${user._id.toString()}`)
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(204);
				});

				it('When an admin deletes a teacher, then it succeeds', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const user = await testHelper.createTestUser({ roles: ['teacher'], schoolId });
					const token = await getAuthToken(schoolId);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/teacher/${user._id.toString()}`)
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(204);
				});

				it('when an admin deletes another admin, then it throws Forbidden', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					// const params = await testHelper.generateRequestParamsFromUser(admin);
					const admin1 = await testHelper.createTestUser({ roles: ['administrator'], schoolId });
					const admin2 = await testHelper.createTestUser({ roles: ['administrator'], schoolId });
					const token = await testHelper.generateJWTFromUser(admin1);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/administrator/${admin2._id.toString()}`)
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(403);
				});

				it('when a teacher deletes a student, then it throws Forbidden', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					// const params = await testHelper.generateRequestParamsFromUser(admin);
					const teacher = await testHelper.createTestUser({ roles: ['teacher'], schoolId });
					const user = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const token = await testHelper.generateJWTFromUser(teacher);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/student/${user._id.toString()}`)
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(403);
				});

				it('when an admin deletes a non-existing user, then it throws Not-Found', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const notFoundId = ObjectId();
					const token = await getAuthToken(schoolId);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/student/${notFoundId.toString()}`)
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(404);
				});

				it('when an admin deletes a student from a different school, then it throws Not-Found', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const { _id: otherSchoolId } = await testHelper.createTestSchool();
					const user = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const token = await getAuthToken(otherSchoolId);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/student/${user._id.toString()}`)
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(403);
				});

				it('when a user with STUDENT_DELETE permission deletes a student, then it succeeds', async () => {
					const school = await testHelper.createTestSchool({
						name: 'testSchool',
					});
					const { _id: schoolId } = school;

					const token = await getPermissionToken(schoolId, ['STUDENT_DELETE']);

					const deleteUser = await testHelper.createTestUser({ roles: ['student'], schoolId });

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

					const checkAccount = await app.service('nest-account-service').findByUserId(deleteUser._id);
					expect(checkAccount).to.be.null;
				});

				it('when a user with STUDENT_DELETE permission deletes a teacher, then it throws Forbidden', async () => {
					const school = await testHelper.createTestSchool({
						name: 'testSchool',
					});
					const { _id: schoolId } = school;

					const token = await getPermissionToken(schoolId, ['STUDENT_DELETE']);

					const deleteUser = await testHelper.createTestUser({ roles: ['teacher'], schoolId });

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
			describe('multiple users', () => {
				it('When an admin deletes a list of students, then it succeeds', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const user1 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const user2 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const user3 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const token = await getAuthToken(schoolId);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/student`)
						.query({ ids: [user1, user2, user3].map((user) => user._id.toString()) })
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(204);
				});

				it('When an admin deletes a list of teachers, then it succeeds', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const user1 = await testHelper.createTestUser({ roles: ['teacher'], schoolId });
					const user2 = await testHelper.createTestUser({ roles: ['teacher'], schoolId });
					const user3 = await testHelper.createTestUser({ roles: ['teacher'], schoolId });
					const token = await getAuthToken(schoolId);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/teacher`)
						.query({ ids: [user1, user2, user3].map((user) => user._id.toString()) })
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(204);
				});

				it('When a teacher deletes a list of students, then it throws Forbidden', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const user1 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const user2 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const user3 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const teacher = await testHelper.createTestUser({ roles: ['teacher'], schoolId });
					const token = await testHelper.generateJWTFromUser(teacher);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/student`)
						.query({ ids: [user1, user2, user3].map((user) => user._id.toString()) })
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(403);
				});

				it('When an admin deletes a list containing a non-existing user, then it throws Not-Found', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const notFoundId = ObjectId();
					const user1 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const user2 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const token = await getAuthToken(schoolId);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/student`)
						.query({ ids: [user1._id, notFoundId, user2._id].map((_id) => _id.toString()) })
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(404);
				});

				it('When an admin deletes a list containing a student from a different school, then it throws Not-Found', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const { _id: otherSchoolId } = await testHelper.createTestSchool();
					const user1 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const user2 = await testHelper.createTestUser({ roles: ['student'], otherSchoolId });
					const user3 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const token = await getAuthToken(schoolId);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/student`)
						.query({ ids: [user1, user2, user3].map((user) => user._id.toString()) })
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(403);
				});

				it('when a user with STUDENT_DELETE permission deletes a list of students, then it succeeds', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const user1 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const user2 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const user3 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const token = await getPermissionToken(schoolId, ['STUDENT_DELETE']);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/student`)
						.query({ ids: [user1, user2, user3].map((user) => user._id.toString()) })
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(204);

					[user1, user2, user3].forEach(async (user) => {
						const checkUser = await usersModelService.get(user._id);
						expect(checkUser.fullName).to.equal('DELETED USER');

						const checkAccount = await app.service('nest-account-service').findByUserId(user._id);
						expect(checkAccount).to.be.null;
					});
				});

				it('when a user with STUDENT_DELETE permission deletes a list of teachers, then it throws Forbidden', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const user1 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const user2 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const user3 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const token = await getPermissionToken(schoolId, ['STUDENT_DELETE']);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/teacher`)
						.query({ ids: [user1, user2, user3].map((user) => user._id.toString()) })
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(403);
				});

				it('When an admin deletes an empty list of students, then it throws Invalid', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const token = await getAuthToken(schoolId);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/student`)
						.query({ ids: [] })
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(400);
				});

				it('When an admin deletes an empty list of teachers, then it throws Invalid', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const token = await getAuthToken(schoolId);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/teacher`)
						.query({ ids: [] })
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(400);
				});

				it('When an admin deletes too many students at once, then it throws Invalid', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const users = await Promise.all(
						[...Array(110)].map(() => testHelper.createTestUser({ roles: ['student'], schoolId }))
					);
					const token = await getAuthToken(schoolId);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/student`)
						.query({ ids: users.map((user) => user._id.toString()) })
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(400);
				});

				it('When an admin deletes too many teachers at once, then it throws Invalid', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const users = await Promise.all(
						[...Array(110)].map(() => testHelper.createTestUser({ roles: ['teacher'], schoolId }))
					);
					const token = await getAuthToken(schoolId);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/teacher`)
						.query({ ids: users.map((user) => user._id.toString()) })
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(400);
				});

				it('When an deletes a student within a teacher list, then it throws Forbidden', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const user1 = await testHelper.createTestUser({ roles: ['teacher'], schoolId });
					const user2 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const user3 = await testHelper.createTestUser({ roles: ['teacher'], schoolId });
					const token = await getAuthToken(schoolId);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/teacher`)
						.query({ ids: [user1, user2, user3].map((user) => user._id.toString()) })
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(403);
				});

				it('When an admin deletes a teacher within a student list, then it throws Forbidden', async () => {
					const { _id: schoolId } = await testHelper.createTestSchool();
					const user1 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const user2 = await testHelper.createTestUser({ roles: ['student'], schoolId });
					const user3 = await testHelper.createTestUser({ roles: ['teacher'], schoolId });
					const token = await getAuthToken(schoolId);
					const request = chai
						.request(app)
						.delete(`/users/v2/admin/student`)
						.query({ ids: [user1, user2, user3].map((user) => user._id.toString()) })
						.set('Accept', 'application/json')
						.set('Authorization', token)
						.set('Content-type', 'application/json');
					const response = await request.send();
					expect(response.status).to.equal(403);
				});
			});
		});
	});
});
