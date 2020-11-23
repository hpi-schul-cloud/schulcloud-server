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
	let accountModelService;
	let usersModelService;
	let classModelService;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
		accountModelService = app.service('accountModel');
		usersModelService = app.service('usersModel');
		classModelService = app.service('classModel');
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

	const createUserWithRelatedData = async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const teacher1 = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const teacher2 = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const user1 = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const user2 = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const user3 = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const user4 = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const { _id: classId } = await testObjects.createTestClass({
			teacherIds: [teacher1._id, teacher2._id],
			userIds: [user1._id, user2._id, user3._id, user4._id, user._id],
			schoolId,
		});
		return { schoolId, classId, user, user1, user2, user3, user4, teacher1, teacher2 };
	};

	describe('API tests', () => {
		it('When an authorized user deletes a student and returns success', async () => {
			const { schoolId, classId, user, user1 } = await createUserWithRelatedData();

			const token = await getAdminToken(schoolId);
			const request = chai
				.request(app)
				.delete(`/users/v2/admin/student/${user._id.toString()}`)
				.query({ userId: user._id.toString() })
				.set('Accept', 'application/json')
				.set('Authorization', token)
				.set('Content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(200);
			expect(response.body.userId).to.deep.equal(user._id.toString());

			const checkClass = await classModelService.find({ query: { _id: classId }, paginate: false });
			expect(checkClass).to.have.lengthOf(1);
			expect(checkClass[0].userIds).to.have.lengthOf(4);

			const assignedUsers = checkClass[0].userIds.filter((userId) => userId.toString() === user1._id.toString());
			const deletedUsers = checkClass[0].userIds.filter((userId) => userId.toString() === user._id.toString());
			expect(assignedUsers).to.have.lengthOf(1);
			expect(deletedUsers).to.have.lengthOf(0);
		});

		it('Fails when not authorized user deletes a student', async () => {
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

		it('Returns error is user not found', async () => {
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

		it('Fails when user from different deletes a student', async () => {
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

		it('users with STUDENT_DELETE permission can REMOVE students', async () => {
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
			expect(response.status).to.equal(200);

			const checkUser = await usersModelService.get(deleteUser._id);
			expect(checkUser.fullName).to.equal('DELETED USER');

			const checkAccount = await accountModelService.find({ query: { userId: deleteUser._id }, paginate: false });
			expect(checkAccount.length).to.equal(0);
		});

		it('users with STUDENT_DELETE permission can not REMOVE teachers', async () => {
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
