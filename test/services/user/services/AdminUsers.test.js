const { expect } = require('chai');
const { MethodNotAllowed } = require('@feathersjs/errors');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise());
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');
const { equal: equalIds } = require('../../../../src/helper/compare').ObjectId;
const { BadRequest, Forbidden, NotFound } = require('../../../../src/errors');

const chai = require('chai');
const { default: chaiAsPromised } = require('chai-as-promised');
chai.use(chaiAsPromised);

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
			email: 'studentTestTwo@de.de',
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

	it('does not allow to create a student in another school', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const { _id: otherSchoolId } = await testObjects.createTestSchool();
		const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
		const params = await testObjects.generateRequestParamsFromUser(admin);
		const email = 'studentotherschool@de.de';

		await expect(
			adminStudentsService.create(
				{ firstName: 'testFirst', lastName: 'testLast', email, schoolId: otherSchoolId },
				params
			)
		).to.be.rejectedWith(Forbidden, 'You do not have valid permissions to access this.');

		const usersOfOtherSchool = await app.service('usersModel').find({ query: { schoolId: otherSchoolId } });
		expect(usersOfOtherSchool.total).to.equal(0);
	});

	it('allows to patch with the schoolId of the own school', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const targetUser = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const actingUser = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
		const params = await testObjects.generateRequestParamsFromUser(actingUser);

		const result = await adminStudentsService.patch(
			targetUser._id,
			{ schoolId: schoolId.toString(), firstName: 'Anne', createAccount: false },
			params
		);

		expect(result.firstName).to.equal('Anne');
		expect(equalIds(result.schoolId, schoolId)).to.equal(true);
	});

	it('does not allow to move a user to another school', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const { _id: otherSchoolId } = await testObjects.createTestSchool();
		const targetUser = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const actingUser = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
		const params = await testObjects.generateRequestParamsFromUser(actingUser);

		await expect(
			adminStudentsService.patch(targetUser._id, { schoolId: otherSchoolId, createAccount: false }, params)
		).to.be.rejectedWith(Forbidden, 'You do not have valid permissions to access this.');

		const user = await app.service('usersModel').get(targetUser._id);
		expect(equalIds(user.schoolId, schoolId)).to.equal(true);
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
			schoolId: school._id,
		});
		await expect(adminStudentsService.create(studentData, params)).to.be.rejectedWith(
			Forbidden,
			"You don't have one of the permissions: STUDENT_CREATE."
		);
	});

	describe('get', () => {
		it('returns the user for internal calls', async () => {
			const user = await testObjects.createTestUser({ roles: ['student'] });

			const result = await adminStudentsService.get(user._id);

			expect(equalIds(result._id, user._id)).to.equal(true);
			expect(equalIds(result.schoolId, user.schoolId)).to.equal(true);
		});

		it('throws BadRequest if no id is given', async () => {
			await expect(adminStudentsService.get(undefined)).to.be.rejectedWith(BadRequest, 'id is required');
		});

		it('is not available for external requests', async () => {
			const { _id: otherSchoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['student'] });
			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: otherSchoolId });
			const params = await testObjects.generateRequestParamsFromUser(admin);

			await expect(adminStudentsService.get(user._id, params)).to.be.rejectedWith(MethodNotAllowed);
		});
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

		const doNotUpdateAccountIfSystemIdIsSet = async (role, type, service) => {
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
			const account = await testObjects.createTestAccount(accountDetails, system, user);

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
			const notUpdatedAccount = await accountService.findById(account.id);
			expect(notUpdatedAccount.username).equals(username);
		};

		// TODO: AdminUsers.updateAccount does not skip accounts of external systems yet, so the username is changed anyway
		it.skip('do not update account if from external system (student, patch)', () =>
			doNotUpdateAccountIfSystemIdIsSet('student', 'patch', adminStudentsService));
		it.skip('do not update account if from external system (teacher, patch)', () =>
			doNotUpdateAccountIfSystemIdIsSet('teacher', 'patch', adminTeachersService));

		const doNotPatchUserIfExternallyManaged = async (role, type, service) => {
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

		const updateFromDifferentSchool = async (role, type, service) => {
			const school = await testObjects.createTestSchool({
				name: 'testSchool1',
			});
			const otherSchool = await testObjects.createTestSchool({
				name: 'testSchool2',
			});

			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
			const user = await testObjects.createTestUser({ roles: [role], schoolId: otherSchool._id });
			const account = await testObjects.createTestAccount(
				{ username: user.email, password: 'password', userId: user._id },
				null,
				user
			);

			const params = await testObjects.generateRequestParamsFromUser(admin);
			params.query = {};

			await expect(
				service[type](
					user._id.toString(),
					{
						email: 'affe@tarzan.de',
						firstName: 'Anne',
						lastName: 'Monkey',
					},
					params
				)
			).to.be.rejectedWith(NotFound, `no record found for id '${user._id}'`);

			const notUpdatedUser = await app.service('usersModel').get(user._id);
			expect(notUpdatedUser.email).to.equal(user.email);
			expect(notUpdatedUser.firstName).to.equal(user.firstName);
			expect(notUpdatedUser.lastName).to.equal(user.lastName);
			const notUpdatedAccount = await accountService.findById(account.id);
			expect(notUpdatedAccount.username).to.equal(user.email);
		};

		it('do not allow patch students from other schools', () =>
			updateFromDifferentSchool('student', 'patch', adminStudentsService));
		it('do not allow patch teacher from other schools', () =>
			updateFromDifferentSchool('teacher', 'patch', adminTeachersService));
		it('do not allow update students from other schools', () =>
			updateFromDifferentSchool('student', 'update', adminStudentsService));
		it('do not allow update teacher from other schools', () =>
			updateFromDifferentSchool('teacher', 'update', adminTeachersService));

		const updateUserWithOtherRole = async (type) => {
			const school = await testObjects.createTestSchool();
			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
			const adminAccount = await testObjects.createTestAccount(
				{ username: admin.email, password: 'password', userId: admin._id },
				null,
				admin
			);
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = {};

			await expect(
				adminStudentsService[type](
					admin._id.toString(),
					{
						email: 'affe@tarzan.de',
						firstName: 'Anne',
						lastName: 'Monkey',
					},
					params
				)
			).to.be.rejectedWith(BadRequest, 'user could not be edit');

			const notUpdatedAdmin = await app.service('usersModel').get(admin._id);
			expect(notUpdatedAdmin.email).to.equal(admin.email);
			expect(notUpdatedAdmin.firstName).to.equal(admin.firstName);
			const notUpdatedAccount = await accountService.findById(adminAccount.id);
			expect(notUpdatedAccount.username).to.equal(admin.email);
		};

		it('do not allow patch users without the student role via the students route', () =>
			updateUserWithOtherRole('patch'));
		it('do not allow update users without the student role via the students route', () =>
			updateUserWithOtherRole('update'));

		const useEmailTwice = async (role, type, service) => {
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
						email: otherUser.email,
						firstName: 'Anne',
						lastName: newUserName,
					},
					params
				);
				expect(result).to.be.undefined;
			} catch (err) {
				expect(err.code).to.be.equal(400);
			}

			const notUpdatedAccount = await accountService.findById(account.id);
			const notUpdatedUser = await app.service('usersModel').get(user._id);
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
			email: 'teacherTestTwo@de.de',
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

	it('does not allow to create a teacher in another school', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const { _id: otherSchoolId } = await testObjects.createTestSchool();
		const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
		const params = await testObjects.generateRequestParamsFromUser(admin);
		const email = 'teacherotherschool@de.de';

		await expect(
			adminTeachersService.create(
				{ firstName: 'testFirst', lastName: 'testLast', email, schoolId: otherSchoolId },
				params
			)
		).to.be.rejectedWith(Forbidden, 'You do not have valid permissions to access this.');

		const usersOfOtherSchool = await app.service('usersModel').find({ query: { schoolId: otherSchoolId } });
		expect(usersOfOtherSchool.total).to.equal(0);
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
			schoolId: school._id,
		});
		await expect(adminTeachersService.create(teacherData, params)).to.be.rejectedWith(
			Forbidden,
			"You don't have one of the permissions: TEACHER_CREATE."
		);
	});
});
