const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise());
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');
const { equal: equalIds } = require('../../../../src/helper/compare').ObjectId;

const testGenericErrorMessage = "You don't have one of the permissions: STUDENT_LIST.";

describe('AdminUsersService', () => {
	let app;
	let server;
	let accountService;
	let adminStudentsService;
	let adminTeachersService;
	let nestServices;

	before(async () => {
		app = await appPromise();
		nestServices = await setupNestServices(app);
		accountService = app.service('nest-account-service');
		adminStudentsService = app.service('/users/admin/students');
		adminTeachersService = app.service('/users/admin/teachers');
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	it('is properly registered', () => {
		expect(adminStudentsService).to.not.equal(undefined);
	});

	it('does not allow student user creation if school is external', async () => {
		const schoolService = app.service('/schools');
		const serviceCreatedSchool = await schoolService.create({ name: 'test', ldapSchoolIdentifier: 'testId' });
		const { _id: schoolId } = serviceCreatedSchool;
		const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
		const params = await testObjects.generateRequestParamsFromUser(admin);
		const mockData = {
			firstName: 'testFirst',
			lastName: 'testLast',
			roles: ['student'],
			schoolId,
		};
		await expect(adminStudentsService.create(mockData, params)).to.be.rejected;
	});

	it('does not allow user creation if email already exists', async () => {
		const admin = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await testObjects.generateRequestParamsFromUser(admin);
		const mockData = {
			firstName: 'testFirst',
			lastName: 'testLast',
			email: 'studentTest@de.de',
			roles: ['student'],
			schoolId: admin.schoolId,
		};
		// creates first student with unique data
		const student = await adminStudentsService.create(mockData, params);
		// creates second student with existent data
		await expect(adminStudentsService.create(mockData, params)).to.be.rejected;
		await app.service('usersModel').remove(student._id);
	});

	it('does not allow user creation if email is disposable', async () => {
		const admin = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await testObjects.generateRequestParamsFromUser(admin);
		const mockData = {
			firstName: 'testFirst',
			lastName: 'testLast',
			email: 'disposable@20minutemail.com',
			roles: ['student'],
			schoolId: admin.schoolId,
		};
		// creates student with disposable email
		await expect(adminStudentsService.create(mockData, params)).to.be.rejected;
	});

	it('ignore schoolId', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const { _id: otherSchoolId } = await testObjects.createTestSchool();
		const targetUser = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const actingUser = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
		const params = await testObjects.generateRequestParamsFromUser(actingUser);

		const result = await adminStudentsService.patch(
			targetUser._id,
			{ schoolId: otherSchoolId, createAccount: false },
			params
		);
		expect(equalIds(result.schoolId, schoolId)).to.equal(true);
	});

	it('ignore roles', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const targetUser = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const actingUser = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
		const params = await testObjects.generateRequestParamsFromUser(actingUser);

		await adminStudentsService.patch(targetUser._id, { roles: ['superhero'], createAccount: false }, params);
		const result = await app.service('users').get(targetUser._id, { query: { $populate: 'roles' } });
		expect(result.roles[0].name).to.equal('student');
	});

	it('users with STUDENT_CREATE permission can access the CREATE method', async () => {
		await testObjects.createTestRole({
			name: 'studentCreatePerm',
			permissions: ['STUDENT_CREATE'],
		});
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			lastName: 'lastTestUser',
			roles: ['studentCreatePerm'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		const studentData = {
			firstName: 'testCreateStudent',
			lastName: 'lastTestCreateStudent',
			email: 'testCreateStudent@de.de',
			roles: ['student'],
			schoolId: school._id,
		};
		const student = await adminStudentsService.create(studentData, params);
		expect(student).to.not.be.undefined;
		expect(student.firstName).to.equals('testCreateStudent');
		await app.service('usersModel').remove(student._id);
	});

	it('users without STUDENT_CREATE permission cannot access the CREATE method', async () => {
		await testObjects.createTestRole({
			name: 'noStudentCreatePerm',
			permissions: [],
		});
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['noStudentCreatePerm'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		const studentData = await testObjects.createTestUser({
			firstName: 'testCreateStudent',
			roles: ['student'],
		});
		await expect(adminStudentsService.create(studentData, params)).to.be.rejected;
	});

	describe('patch and update', () => {
		afterEach(async () => {
			await testObjects.cleanup();
		});

		it('updates account username if user email is updated', async () => {
			const school = await testObjects.createTestSchool({
				name: 'testSchool1',
			});
			// given
			const user = await testObjects.createTestUser({ roles: ['student'], schoolId: school._id });
			const accountDetails = {
				username: user.email,
				password: 'password',
				userId: user._id,
			};
			const account = await testObjects.createTestAccount(accountDetails, false, user);
			expect(user.email).equals(account.username);

			// when
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = {};
			await adminStudentsService.patch(user._id.toString(), { email: 'foo@bar.baz', createAccount: false }, params);

			// then
			const updatedAccount = await accountService.findById(account.id);
			expect(updatedAccount.username).equals('foo@bar.baz');
		});

		const doNotUpdateAccountIfSystemIdIsSet = (role, type, service) => async () => {
			const school = await testObjects.createTestSchool({
				name: 'testSchool1',
			});
			const system = await testObjects.createTestSystem();
			const username = 'hans-kunz';
			// given
			const user = await testObjects.createTestUser({ roles: [role], schoolId: school._id });
			const accountDetails = {
				username,
				password: 'password',
				userId: user._id,
				systemId: system._id,
			};
			const account = await testObjects.createTestAccount(accountDetails);

			// when
			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
			const params = await testObjects.generateRequestParamsFromUser(admin);
			params.query = {};
			await service[type](
				user._id.toString(),
				{
					firstName: 'golf',
					lastName: 'monk',
					email: 'foo@bar.baz',
				},
				params
			);

			// then
			const notUpdatedAccount = await accountService.findById(account._id.toString());
			expect(notUpdatedAccount.username).equals(username);
		};

		it('do not update account if from external system (student, patch)', () =>
			doNotUpdateAccountIfSystemIdIsSet('student', 'patch', adminStudentsService));
		it('do not update account if from external system (teacher, patch)', () =>
			doNotUpdateAccountIfSystemIdIsSet('teacher', 'patch', adminTeachersService));

		const doNotPatchUserIfExternallyManaged = (role, type, service) => async () => {
			const school = await testObjects.createTestSchool({
				name: 'testSchool1',
				source: 'notInternal',
			});
			const user = await testObjects.createTestUser({ roles: [role], schoolId: school._id });
			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
			const params = await testObjects.generateRequestParamsFromUser(admin);
			params.query = {};

			try {
				await service[type](
					user._id.toString(),
					{
						firstName: 'golf',
						lastName: 'monk',
						email: 'foo@bar.baz',
					},
					params
				);
				expect.fail('The previous call should have failed');
			} catch (err) {
				expect(err.code).to.equal(403);
				expect(err.message).to.equal(
					'Creating, editing, or removing students or teachers is only possible in the source system.'
				);
			}
		};

		it('does not allow patch student if the school is externally managed (student, patch)', () =>
			doNotPatchUserIfExternallyManaged('student', 'patch', adminStudentsService));
		it('does not allow patch teacher if the school is externally managed (teacher, patch)', () =>
			doNotPatchUserIfExternallyManaged('teacher', 'patch', adminTeachersService));

		const updateFromDifferentSchool = (role, type, service) => async () => {
			const school = await testObjects.createTestSchool({
				name: 'testSchool1',
			});
			const otherSchool = await testObjects.createTestSchool({
				name: 'testSchool2',
			});

			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
			const student = await testObjects.createTestUser({ roles: [role], schoolId: otherSchool._id });

			const params = await testObjects.generateRequestParamsFromUser(admin);
			params.query = {};

			try {
				const result = await service[type](
					student._id.toString(),
					{
						email: 'affe@tarzan.de',
						firstName: 'Anne',
						lastName: 'Monkey',
					},
					params
				);
				expect(result).to.be.undefined;
			} catch (err) {
				expect(err.code).to.be.equal(400);
			}
		};

		it('do not allow patch students from other schools', () =>
			updateFromDifferentSchool('student', 'patch', adminStudentsService));
		it('do not allow patch teacher from other schools', () =>
			updateFromDifferentSchool('teacher', 'patch', adminTeachersService));

		const useEmailTwice = (role, type, service) => async () => {
			const school = await testObjects.createTestSchool({
				name: 'testSchool1',
			});

			const userMail = 'test@affe.de';
			const newUserName = 'Monkey';

			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
			const user = await testObjects.createTestUser({
				roles: [role],
				email: userMail,
				schoolId: school._id,
			});
			const account = await testObjects.createTestAccount(
				{
					username: user.email,
					password: 'password',
					userId: user._id,
				},
				false,
				user
			);
			expect(user.email).equals(account.username);
			const otherUser = await testObjects.createTestUser({
				roles: ['teacher'],
				email: 'cool@affe.de',
				schoolId: school._id,
			});
			const otherAccount = await testObjects.createTestAccount(
				{
					username: otherUser.email,
					password: 'password',
					userId: otherUser._id,
				},
				false,
				otherUser
			);
			expect(otherUser.email).equals(otherAccount.username);

			const params = await testObjects.generateRequestParamsFromUser(admin);
			params.query = {};

			try {
				const result = await service[type](
					user._id.toString(),
					{
						email: otherUser.eamil,
						firstName: 'Anne',
						lastName: newUserName,
					},
					params
				);
				expect(result).to.be.undefined;
			} catch (err) {
				expect(err.code).to.be.equal(400);
			}

			const notUpdatedAccount = await accountService.findById(account._id.toString());
			const notUpdatedUser = await service.get(user._id, params);
			expect(notUpdatedAccount.username).equal(userMail);
			expect(notUpdatedUser.email).to.be.equal(userMail);
			expect(notUpdatedUser.lastName).to.be.not.equal(newUserName);
		};

		it('block changes student patch if email already use', () =>
			useEmailTwice('student', 'patch', adminStudentsService));
		it('block changes teacher patch if email already in use', () =>
			useEmailTwice('teacher', 'patch', adminTeachersService));
	});
});

describe('AdminTeachersService', () => {
	let app;
	let adminTeachersService;
	let consentService;
	let server;
	let nestServices;

	before(async () => {
		app = await appPromise();
		nestServices = await setupNestServices(app);
		adminTeachersService = app.service('/users/admin/teachers');
		consentService = app.service('consents');
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	it('is properly registered', () => {
		expect(adminTeachersService).to.not.equal(undefined);
	});

	it('does not allow teacher user creation if school is external', async () => {
		const schoolService = app.service('/schools');
		const serviceCreatedSchool = await schoolService.create({ name: 'test', ldapSchoolIdentifier: 'testId' });
		const { _id: schoolId } = serviceCreatedSchool;
		const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
		const params = await testObjects.generateRequestParamsFromUser(admin);
		const mockData = {
			firstName: 'testFirst',
			lastName: 'testLast',
			roles: ['teacher'],
			schoolId,
		};
		await expect(adminTeachersService.create(mockData, params)).to.be.rejected;
	});

	it('does not allow user creation if email already exists', async () => {
		const admin = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await testObjects.generateRequestParamsFromUser(admin);
		const mockData = {
			firstName: 'testFirst',
			lastName: 'testLast',
			email: 'teacherTest@de.de',
			roles: ['teacher'],
			schoolId: admin.schoolId,
		};
		// creates first teacher with unique data
		const teacher = await adminTeachersService.create(mockData, params);
		// creates second teacher with existent data
		await expect(adminTeachersService.create(mockData, params)).to.be.rejected;
		await app.service('usersModel').remove(teacher._id);
	});

	it('does not allow user creation if email is disposable', async () => {
		const admin = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await testObjects.generateRequestParamsFromUser(admin);
		const mockData = {
			firstName: 'testFirst',
			lastName: 'testLast',
			email: 'disposable@20minutemail.com',
			roles: ['teacher'],
			schoolId: admin.schoolId,
		};
		// creates teacher with disposable email
		await expect(adminTeachersService.create(mockData, params)).to.be.rejected;
	});

	it('users with TEACHER_CREATE permission can access the CREATE method', async () => {
		await testObjects.createTestRole({
			name: 'teacherCreatePerm',
			permissions: ['TEACHER_CREATE'],
		});
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			lastName: 'lastTestUser',
			roles: ['teacherCreatePerm'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		const teacherData = {
			firstName: 'testCreateTeacher',
			lastName: 'lastTestCreateTeacher',
			email: 'testCreateTeacher@de.de',
			roles: ['teacher'],
			schoolId: school._id,
		};
		const teacher = await adminTeachersService.create(teacherData, params);
		expect(teacher).to.not.be.undefined;
		expect(teacher.firstName).to.equals('testCreateTeacher');
		await app.service('usersModel').remove(teacher._id);
	});

	it('users without TEACHER_CREATE permission cannot access the CREATE method', async () => {
		await testObjects.createTestRole({
			name: 'noTeacherCreatePerm',
			permissions: [],
		});
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['noTeacherCreatePerm'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		const teacherData = await testObjects.createTestUser({
			firstName: 'testCreateTeacher',
			roles: ['teacher'],
		});
		await expect(adminTeachersService.create(teacherData, params)).to.be.rejected;
	});
});
