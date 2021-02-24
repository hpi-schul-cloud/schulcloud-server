const { expect } = require('chai');
const logger = require('../../../../src/logger/index');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);
const accountModel = require('../../../../src/services/account/model');

const { equal: equalIds } = require('../../../../src/helper/compare').ObjectId;

const testGenericErrorMessage = "You don't have one of the permissions: STUDENT_LIST.";

describe.only('AdminUsersService', () => {
	let app;
	let server;
	let accountService;
	let adminStudentsService;
	let adminTeachersService;

	before(async () => {
		app = await appPromise;
		accountService = app.service('/accounts');
		adminStudentsService = app.service('/users/admin/students');
		adminTeachersService = app.service('/users/admin/teachers');
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	it('is properly registered', () => {
		expect(adminStudentsService).to.not.equal(undefined);
	});

	it('builds class display names correctly', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] }).catch((err) => {
			logger.warning('Can not create teacher', err);
		});
		const student = await testObjects.createTestUser({ roles: ['student'] }).catch((err) => {
			logger.warning('Can not create student', err);
		});

		expect(teacher).to.not.be.undefined;
		expect(student).to.not.be.undefined;
		const testClass = await testObjects.createTestClass({
			name: 'staticName',
			userIds: [student._id],
			teacherIds: [teacher._id],
		});
		expect(testClass).to.not.be.undefined;

		const gradeLevelClass = await testObjects
			.createTestClass({
				name: 'A',
				userIds: [student._id],
				teacherIds: [teacher._id],
				nameFormat: 'gradeLevel+name',
				gradeLevel: 2,
			})
			.catch((err) => {
				logger.warning('Can not create test class.', err);
			});
		expect(gradeLevelClass).to.not.be.undefined;

		const params = {
			account: {
				userId: teacher._id,
			},
			query: {},
		};

		const result = await adminStudentsService.find(params).catch((err) => {
			logger.warning('Can not execute adminStudentsService.find.', err);
		});

		const searchClass = (users, name) =>
			users.some((user) => equalIds(student._id, user._id) && user.classes.includes(name));
		expect(result.data).to.not.be.undefined;
		expect(searchClass(result.data, 'staticName')).to.be.true;
		expect(searchClass(result.data, '2A')).to.be.true;
	});

	it('request muliple users by id', async () => {
		const admin = await testObjects.createTestUser({ roles: ['administrator'] }).catch((err) => {
			logger.warning('Can not create admin', err);
		});
		const params = await testObjects.generateRequestParamsFromUser(admin);

		const student1 = await testObjects.createTestUser({ roles: ['student'] }).catch((err) => {
			logger.warning('Can not create student', err);
		});

		const student2 = await testObjects.createTestUser({ roles: ['student'] }).catch((err) => {
			logger.warning('Can not create student', err);
		});

		const student3 = await testObjects.createTestUser({ roles: ['student'] }).catch((err) => {
			logger.warning('Can not create student', err);
		});

		params.query = {
			users: [student1._id.toString(), student2._id.toString(), student3._id.toString()],
		};

		const result = await adminStudentsService.find(params).catch((err) => {
			logger.warning('Can not execute adminStudentsService.find.', err);
		});

		expect(result.total).to.equal(3);
	});

	// https://ticketsystem.schul-cloud.org/browse/SC-5076
	it('student can not administrate students', async () => {
		const student = await testObjects.createTestUser({ roles: ['student'] });
		const params = await testObjects.generateRequestParamsFromUser(student);
		params.query = {};
		try {
			await adminStudentsService.find(params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.message).to.equal(testGenericErrorMessage);
			expect(err.code).to.equal(403);
		}
	});

	it('teacher can administrate students', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = {};
		const result = await adminStudentsService.find(params);
		expect(result).to.not.be.undefined;
	});

	it('only shows current classes', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const student = await testObjects.createTestUser({ firstName: 'Max', roles: ['student'] });
		const currentSchool = await app.service('schools').get(teacher.schoolId);

		const { currentYear } = currentSchool;
		const lastYear = currentSchool.years.lastYear._id;

		const classPromises = [];
		classPromises.push(
			testObjects.createTestClass({
				name: 'classFromThisYear',
				userIds: [student._id],
				teacherIds: [teacher._id],
				year: currentYear,
			})
		);
		classPromises.push(
			testObjects.createTestClass({
				name: 'classFromLastYear',
				userIds: [student._id],
				teacherIds: [teacher._id],
				year: lastYear,
			})
		);
		classPromises.push(
			testObjects.createTestClass({
				name: 'classWithoutYear',
				userIds: [student._id],
				teacherIds: [teacher._id],
			})
		);

		await Promise.all(classPromises);

		const params = {
			account: {
				userId: teacher._id,
			},
			query: {},
		};

		const result = await adminStudentsService.find(params);

		expect(result.data).to.not.be.undefined;
		const studentResult = result.data.filter((u) => equalIds(u._id, student._id))[0];
		expect(studentResult.classes).to.include('classFromThisYear');
		expect(studentResult.classes).to.not.include('classFromLastYear');
		expect(studentResult.classes).to.include('classWithoutYear');
	});

	it('sorts students correctly', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] }).catch((err) => {
			logger.warning('Can not create teacher', err);
		});
		const student1 = await testObjects
			.createTestUser({
				firstName: 'Max',
				roles: ['student'],
				consent: {
					userConsent: {
						form: 'digital',
						privacyConsent: true,
						termsOfUseConsent: true,
					},
					parentConsents: [
						{
							form: 'digital',
							privacyConsent: true,
							termsOfUseConsent: true,
						},
					],
				},
			})
			.catch((err) => {
				logger.warning('Can not create student', err);
			});
		const student2 = await testObjects
			.createTestUser({
				firstName: 'Moritz',
				roles: ['student'],
			})
			.catch((err) => {
				logger.warning('Can not create student', err);
			});

		expect(teacher).to.not.be.undefined;
		expect(student1).to.not.be.undefined;
		expect(student2).to.not.be.undefined;

		const testClass1 = await testObjects.createTestClass({
			name: '1a',
			userIds: [student1._id],
			teacherIds: [teacher._id],
		});
		expect(testClass1).to.not.be.undefined;
		const testClass2 = await testObjects.createTestClass({
			name: '2B',
			userIds: [student1._id],
			teacherIds: [teacher._id],
		});
		expect(testClass2).to.not.be.undefined;

		const createParams = (sortObject) => ({
			account: {
				userId: teacher._id,
			},
			query: {
				$sort: sortObject,
			},
		});

		const resultSortedByFirstName = await adminStudentsService.find(createParams({ firstName: -1 }));
		expect(resultSortedByFirstName.data.lenght > 1);
		expect(resultSortedByFirstName.data[0].firstName > resultSortedByFirstName.data[1].firstName);

		const resultSortedByClass = await adminStudentsService.find(createParams({ class: -1 }));
		expect(resultSortedByClass.data[0].classes[0] > resultSortedByClass.data[1].classes[0]);

		/* TODO: Do not work!
		const sortOrder = {
			missing: 1,
			parentsAgreed: 2,
			ok: 3,
		};

		const resultSortedByConsent = await adminStudentsService.find(createParams({ consent: -1 }));
		expect(sortOrder[resultSortedByConsent.data[0].consent.consentStatus])
			.to.be.at.least(sortOrder[resultSortedByConsent.data[1].consent.consentStatus]);
		*/
	});

	it('filters students correctly', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const studentWithoutConsents = await testObjects.createTestUser({ roles: ['student'] });

		const currentDate = new Date();
		const birthday = new Date();
		birthday.setFullYear(currentDate.getFullYear() - 15);
		const studentWithParentConsent = await testObjects.createTestUser({
			roles: ['student'],
			birthday,
			consent: {
				parentConsents: [
					{
						form: 'digital',
						privacyConsent: true,
						termsOfUseConsent: true,
					},
				],
			},
		});

		const studentWithConsents = await testObjects.createTestUser({
			roles: ['student'],
			consent: {
				userConsent: {
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
				},
				parentConsents: [
					{
						form: 'digital',
						privacyConsent: true,
						termsOfUseConsent: true,
					},
				],
			},
		});

		const createParams = (status) => ({
			account: {
				userId: teacher._id,
			},
			query: {
				consentStatus: {
					$in: [status],
				},
			},
		});

		const resultMissing = (await adminStudentsService.find(createParams('missing'))).data;
		const idsMissing = resultMissing.map((e) => e._id.toString());
		expect(idsMissing).to.include(studentWithoutConsents._id.toString());
		expect(idsMissing).to.not.include(studentWithParentConsent._id.toString(), studentWithConsents._id.toString());

		const resultParentsAgreed = (await adminStudentsService.find(createParams('parentsAgreed'))).data;
		const idsParentsAgreed = resultParentsAgreed.map((e) => e._id.toString());
		expect(idsParentsAgreed).to.include(studentWithParentConsent._id.toString());
		expect(idsParentsAgreed).to.not.include(studentWithoutConsents._id.toString(), studentWithConsents._id.toString());

		const resultOk = (await adminStudentsService.find(createParams('ok'))).data;
		const idsOk = resultOk.map((e) => e._id.toString());
		expect(idsOk).to.include(studentWithConsents._id.toString());
		expect(idsOk).to.not.include(studentWithoutConsents._id.toString(), studentWithParentConsent._id.toString());
	});

	it('can filter by creation date', async () => {
		const dateBefore = new Date();
		const findUser = await testObjects.createTestUser({ roles: ['student'] });
		const actingUser = await testObjects.createTestUser({ roles: ['administrator'] });
		const dateAfter = new Date();
		await testObjects.createTestUser({ roles: ['student'] });
		const params = await testObjects.generateRequestParamsFromUser(actingUser);
		params.query = { createdAt: { $gte: dateBefore, $lte: dateAfter } };

		const result = await adminStudentsService.find(params);
		expect(result.total).to.equal(1);
		expect(result.data[0]._id.toString()).to.equal(findUser._id.toString());
	});

	it('can filter by creation date as ISO string', async () => {
		const findUser = await testObjects.createTestUser({ roles: ['student'] });
		const actingUser = await testObjects.createTestUser({ roles: ['administrator'] });
		await testObjects.createTestUser({ roles: ['student'] });
		const params = await testObjects.generateRequestParamsFromUser(actingUser);
		params.query = { createdAt: findUser.createdAt };

		const result = await adminStudentsService.find(params);
		expect(result.total).to.equal(1);
		expect(result.data[0]._id.toString()).to.equal(findUser._id.toString());
	});

	it('can filter by creation date as ISO string with range', async () => {
		const dateBefore = new Date();
		const findUser = await testObjects.createTestUser({ roles: ['student'] });
		const actingUser = await testObjects.createTestUser({ roles: ['administrator'] });
		const dateAfter = new Date();
		await testObjects.createTestUser({ roles: ['student'] });
		const params = await testObjects.generateRequestParamsFromUser(actingUser);
		params.query = {
			createdAt: {
				$gte: dateBefore.toISOString(),
				$lte: dateAfter.toISOString(),
			},
		};

		const result = await adminStudentsService.find(params);
		expect(result.total).to.equal(1);
		expect(result.data[0]._id.toString()).to.equal(findUser._id.toString());
	});

	it('pagination should work', async () => {
		const limit = 1;
		let skip = 0;

		const teacher = await testObjects.createTestUser({ roles: ['teacher'] }).catch((err) => {
			logger.warning('Can not create teacher', err);
		});

		expect(teacher).to.not.be.undefined;

		const createParams = () => ({
			account: {
				userId: teacher._id,
			},
			query: {
				$limit: limit,
				$skip: skip,
			},
		});

		const result1 = await adminStudentsService.find(createParams());
		expect(result1.data.length).to.be.equal(1);
		expect(result1.limit).to.be.equal(limit);
		expect(result1.skip).to.be.equal(skip);
		const studentId1 = result1.data[0]._id.toString();
		expect(studentId1).to.not.be.undefined;
		skip = 1;

		const result2 = await adminStudentsService.find(createParams());
		expect(result2.data.length).to.be.equal(1);
		expect(result2.limit).to.be.equal(limit);
		expect(result2.skip).to.be.equal(skip);
		const studentId2 = result2.data[0]._id.toString();
		expect(studentId2).to.not.be.equal(studentId1);
	});

	it('birthday date in DD.MM.YYYY format', async () => {
		// given
		const birthdayMock = new Date(2000, 0, 1, 20, 45, 30);
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const mockStudent = await testObjects.createTestUser({
			firstName: 'Lukas',
			birthday: birthdayMock,
			roles: ['student'],
		});
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		// when
		const students = (await adminStudentsService.find(params)).data;

		// then
		const testStudent = students.find((stud) => mockStudent.firstName === stud.firstName);
		expect(testStudent.birthday).equals('01.01.2000');
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
		try {
			await adminStudentsService.create(mockData, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(403);
			expect(err.message).to.equal('Creating new students or teachers is only possible in the source system.');
		}
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
		await adminStudentsService.create(mockData, params);
		// creates second student with existent data
		try {
			await adminStudentsService.create(mockData, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(400);
			expect(err.message).to.equal('Email already exists.');
		}
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
		try {
			await adminStudentsService.create(mockData, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(400);
			expect(err.message).to.equal('EMAIL_DOMAIN_BLOCKED');
		}
	});

	it('ignore schoolId', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const { _id: otherSchoolId } = await testObjects.createTestSchool();
		const targetUser = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const actingUser = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
		const params = await testObjects.generateRequestParamsFromUser(actingUser);

		const result = await adminStudentsService.patch(targetUser._id, { schoolId: otherSchoolId }, params);
		expect(equalIds(result.schoolId, schoolId)).to.equal(true);
	});

	it('ignore roles', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const targetUser = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const actingUser = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
		const params = await testObjects.generateRequestParamsFromUser(actingUser);

		await adminStudentsService.patch(targetUser._id, { roles: ['superhero'] }, params);
		const result = await app.service('users').get(targetUser._id, { query: { $populate: 'roles' } });
		expect(result.roles[0].name).to.equal('student');
	});

	it('users with STUDENT_LIST permission can access the FIND method', async () => {
		await testObjects.createTestRole({
			name: 'studentListPerm',
			permissions: ['STUDENT_LIST'],
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['studentListPerm'],
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		const { data } = await adminStudentsService.find(params);
		expect(data).to.not.have.lengthOf(0);
	});

	it('users without STUDENT_LIST permission cannot access the FIND method', async () => {
		await testObjects.createTestRole({
			name: 'noStudentListPerm',
			permissions: [],
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['noStudentListPerm'],
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);

		try {
			await adminStudentsService.find(params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have one of the permissions: STUDENT_LIST.");
		}
	});

	it('users with STUDENT_LIST permission can access the GET method', async () => {
		await testObjects.createTestRole({
			name: 'studentListPerm',
			permissions: ['STUDENT_LIST'],
		});
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['studentListPerm'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		const student = await testObjects.createTestUser({
			firstName: 'Hans',
			roles: ['student'],
			schoolId: school._id,
		});

		const user = await adminStudentsService.get(student._id.toString(), params);
		expect(user.firstName).to.be.equal(student.firstName);
	});

	it('users without STUDENT_LIST permission cannot access the GET method', async () => {
		await testObjects.createTestRole({
			name: 'noStudentListPerm',
			permissions: [],
		});
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['noStudentListPerm'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		const student = await testObjects.createTestUser({ roles: ['student'], schoolId: school._id });

		try {
			await adminStudentsService.get(student._id, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have one of the permissions: STUDENT_LIST.");
		}
	});

	it('users cannot GET students from foreign schools', async () => {
		await testObjects.createTestRole({
			name: 'studentListPerm',
			permissions: ['STUDENT_LIST'],
		});
		const school = await testObjects.createTestSchool({
			name: 'testSchool1',
		});
		const otherSchool = await testObjects.createTestSchool({
			name: 'testSchool2',
		});
		const testUSer = await testObjects.createTestUser({ roles: ['studentListPerm'], schoolId: school._id });
		const params = await testObjects.generateRequestParamsFromUser(testUSer);
		const student = await testObjects.createTestUser({ roles: ['student'], schoolId: otherSchool._id });
		const user = await adminStudentsService.get(student._id, params);
		expect(user).to.be.empty;
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

		try {
			await adminStudentsService.create(studentData, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have one of the permissions: STUDENT_CREATE.");
		}
	});

	it('users with STUDENT_DELETE permission can access the REMOVE method', async () => {
		await testObjects.createTestRole({
			name: 'studentDeletePerm',
			permissions: ['STUDENT_CREATE', 'STUDENT_DELETE'],
		});
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['studentDeletePerm'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		const studentData = {
			firstName: 'testDeleteStudent',
			lastName: 'lastTestDeleteStudent',
			email: 'testDeleteStudent@de.de',
			roles: ['student'],
			schoolId: school._id,
		};
		const student = await adminStudentsService.create(studentData, params);
		params.query = {
			...params.query,
			_ids: [student._id],
		};
		const deletedStudent = await adminStudentsService.remove(null, params);
		expect(deletedStudent).to.not.be.undefined;
		expect(deletedStudent.firstName).to.equals('testDeleteStudent');
	});

	it('users without STUDENT_DELETE permission cannnot access the REMOVE method', async () => {
		await testObjects.createTestRole({
			name: 'noStudentDeletePerm',
			permissions: ['STUDENT_CREATE'],
		});
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['noStudentDeletePerm'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		const studentData = {
			firstName: 'testDeleteStudent',
			lastName: 'lastDeleteStudent',
			email: 'testDeleteStudent2@de.de',
			roles: ['student'],
			schoolId: school._id,
		};
		const student = await adminStudentsService.create(studentData, params);
		params.query = {
			...params.query,
			_ids: [],
		};
		try {
			await adminStudentsService.remove(student, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have one of the permissions: STUDENT_DELETE.");
		}
	});

	it('users cannot REMOVE students from foreign schools', async () => {
		const school = await testObjects.createTestSchool({
			name: 'testSchool1',
		});
		const otherSchool = await testObjects.createTestSchool({
			name: 'testSchool2',
		});
		const testUSer = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
		const params = await testObjects.generateRequestParamsFromUser(testUSer);
		const studentOne = await testObjects.createTestUser({
			roles: ['student'],
			schoolId: otherSchool._id,
		});
		const studentTwo = await testObjects.createTestUser({
			roles: ['student'],
			schoolId: otherSchool._id,
		});
		params.query = {
			...params.query,
			_ids: [studentOne._id, studentTwo._id],
		};
		try {
			await adminStudentsService.remove(null, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(403);
			expect(err.message).to.equal('You cannot remove users from other schools.');
		}
	});

	it('REMOVED users should also have their account deleted', async () => {
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['administrator'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);

		const studentDetails = {
			firstName: 'testDeleteStudent',
			lastName: 'Tested',
			email: `testDeleteStudent${Date.now()}@tested.de`,
			schoolId: school._id,
		};
		const student = await testObjects.createTestUser(studentDetails);

		const accountDetails = {
			username: `testDeleteStudent${Date.now()}@tested.de`,
			password: 'ca4t9fsfr3dsd',
			userId: student._id,
		};
		const studentAccount = await app.service('/accounts').create(accountDetails);

		params.query = {
			...params.query,
			_ids: [student._id],
		};
		const deletedAccount = await app.service('accountModel').get(studentAccount._id);
		expect(deletedAccount).to.not.be.undefined;
		expect(deletedAccount.username).to.equals(studentAccount.username);

		const deletedStudent = await adminStudentsService.remove(null, params);
		expect(deletedStudent).to.not.be.undefined;
		expect(deletedStudent.firstName).to.equals('testDeleteStudent');

		try {
			await app.service('accountModel').get(studentAccount._id);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(404);
		}
	});

	it('REMOVE requests must include _ids or id', async () => {
		const testUSer = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await testObjects.generateRequestParamsFromUser(testUSer);
		// empty query without _ids key
		params.query = {};
		try {
			await adminStudentsService.remove(null, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(400);
			expect(err.message).to.equal('The request requires either an id or ids to be present.');
		}
	});

	it('_ids must be of array type', async () => {
		const testUSer = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await testObjects.generateRequestParamsFromUser(testUSer);
		params.query = {
			...params.query,
			_ids: 'this is the wrong type',
		};
		try {
			await adminStudentsService.remove(null, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(400);
			expect(err.message).to.equal('The type for ids is incorrect.');
		}
	});

	it('_ids elements must be a valid objectId', async () => {
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['administrator'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		const studentData = {
			firstName: 'validDeleteStudent',
			lastName: 'lastValidDeleteStudent',
			email: 'validDeleteStudent@de.de',
			roles: ['student'],
			schoolId: school._id,
		};
		const student = await adminStudentsService.create(studentData, params);
		params.query = {
			...params.query,
			_ids: [student._id],
		};

		const deletedStudent = await adminStudentsService.remove(null, params);
		expect(deletedStudent).to.not.be.undefined;
		expect(deletedStudent.firstName).to.equals('validDeleteStudent');

		const otherStudentData = {
			firstName: 'otherValidDeleteStudent',
			lastName: 'otherLastValidDeleteStudent',
			email: 'otherValidDeleteStudent@de.de',
			roles: ['student'],
			schoolId: school._id,
		};
		const otherStudent = await adminStudentsService.create(otherStudentData, params);
		params.query = {
			...params.query,
			_ids: [otherStudent._id, 'wrong type'],
		};

		try {
			await adminStudentsService.remove(null, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(400);
			expect(err.message).to.equal('The type for either one or several ids is incorrect.');
		}
	});

	it('id can be both object and string type', async () => {
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUSer = await testObjects.createTestUser({
			roles: ['administrator'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUSer);
		params.query = {
			...params.query,
			_ids: [],
		};
		const studentData = {
			firstName: 'testDeleteStudent',
			lastName: 'lastDeleteStudent',
			email: 'testDeleteStudent3@de.de',
			roles: ['student'],
			schoolId: school._id,
		};

		const objectTypeStudentTest = await adminStudentsService.create(studentData, params);
		const deletedObjectType = await adminStudentsService.remove(objectTypeStudentTest, params);
		expect(deletedObjectType).to.not.be.undefined;
		expect(deletedObjectType.firstName).to.equals('testDeleteStudent');

		const stringTypeStudentTest = await adminStudentsService.create(studentData, params);
		const deletedeStringType = await adminStudentsService.remove(stringTypeStudentTest._id, params);
		expect(deletedeStringType).to.not.be.undefined;
		expect(deletedeStringType.firstName).to.equals('testDeleteStudent');
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
			await adminStudentsService.patch(user._id.toString(), { email: 'foo@bar.baz' }, params);

			// then
			const updatedAccount = await accountService.get(account._id);
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
			const account = await accountModel.create(accountDetails);

			try {
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
				const notUpdatedAccount = await accountService.get(account._id);
				expect(notUpdatedAccount.username).equals(username);
				await accountModel.remove({ _id: account._id });
			} catch (err) {
				await accountModel.remove({ _id: account._id });
				throw err;
			}
		};

		it('do not update account if from external system (student, patch)', () =>
			doNotUpdateAccountIfSystemIdIsSet('student', 'patch', adminStudentsService));
		it('do not update account if from external system (teacher, patch)', () =>
			doNotUpdateAccountIfSystemIdIsSet('teacher', 'patch', adminTeachersService));

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

			const notUpdatedAccount = await accountService.get(account._id);
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

	it('can search the user data by firstName', async () => {
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			roles: ['administrator'],
			schoolId: school._id,
		});
		const student0 = await testObjects.createTestUser({
			roles: ['student'],
			schoolId: school._id,
		});
		const student1 = await testObjects.createTestUser({
			roles: ['student'],
			schoolId: school._id,
		});
		const student2 = await testObjects.createTestUser({
			roles: ['student'],
			firstName: 'Lars',
			lastName: 'Ulrich',
			schoolId: school._id,
		});
		const student3 = await testObjects.createTestUser({
			roles: ['student'],
			firstName: 'James',
			lastName: 'Hetfield',
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		params.query = {
			...params.query,
			searchQuery: student0.firstName,
		};
		const result = await adminStudentsService.find(params);

		const resultIds = [];
		result.data.forEach((user) => {
			resultIds.push(user._id.toString());
		});

		expect(result.data).to.not.be.undefined;
		expect(result.data[0].firstName).to.equal(student0.firstName);
		expect(resultIds).to.include.members([student0._id.toString(), student1._id.toString()]);
		expect(result.data[0].lastName).to.equal(student0.lastName);
		expect(result.data[0].firstName).to.not.equal(student2.firstName);
		expect(result.data[0].lastName).to.not.equal(student2.lastName);
		expect(result.data[0].firstName).to.not.equal(student3.firstName);
		expect(result.data[0].lastName).to.not.equal(student3.lastName);
	});

	it('can search the user data by lastName', async () => {
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			roles: ['administrator'],
			schoolId: school._id,
		});
		const student0 = await testObjects.createTestUser({
			roles: ['student'],
			schoolId: school._id,
		});
		const student1 = await testObjects.createTestUser({
			roles: ['student'],
			schoolId: school._id,
		});
		const student2 = await testObjects.createTestUser({
			roles: ['student'],
			firstName: 'Lars',
			lastName: 'Ulrich',
			schoolId: school._id,
		});
		const student3 = await testObjects.createTestUser({
			roles: ['student'],
			firstName: 'James',
			lastName: 'Hetfield',
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		params.query = {
			...params.query,
			searchQuery: student0.lastName,
		};
		const result = await adminStudentsService.find(params);

		const resultIds = [];
		result.data.forEach((user) => {
			resultIds.push(user._id.toString());
		});

		expect(result.data).to.not.be.undefined;
		expect(result.data[0].firstName).to.equal(student0.firstName);
		expect(resultIds).to.include.members([student0._id.toString(), student1._id.toString()]);
		expect(result.data[0].lastName).to.equal(student0.lastName);
		expect(result.data[0].firstName).to.not.equal(student2.firstName);
		expect(result.data[0].lastName).to.not.equal(student2.lastName);
		expect(result.data[0].firstName).to.not.equal(student3.firstName);
		expect(result.data[0].lastName).to.not.equal(student3.lastName);
	});

	it('can search the user data by firstName + lastName', async () => {
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			roles: ['administrator'],
			schoolId: school._id,
		});
		const student0 = await testObjects.createTestUser({
			roles: ['student'],
			schoolId: school._id,
		});
		const student1 = await testObjects.createTestUser({
			roles: ['student'],
			schoolId: school._id,
		});
		const student2 = await testObjects.createTestUser({
			roles: ['student'],
			firstName: 'Lars',
			lastName: 'Ulrich',
			schoolId: school._id,
		});
		const student3 = await testObjects.createTestUser({
			roles: ['student'],
			firstName: 'James',
			lastName: 'Hetfield',
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		params.query = {
			...params.query,
			searchQuery: `${student0.firstName} ${student0.lastName}`,
		};
		const result = await adminStudentsService.find(params);

		const resultIds = [];
		result.data.forEach((user) => {
			resultIds.push(user._id.toString());
		});

		expect(result.data).to.not.be.undefined;
		expect(result.data[0].firstName).to.equal(student0.firstName);
		expect(resultIds).to.include.members([student0._id.toString(), student1._id.toString()]);
		expect(result.data[0].lastName).to.equal(student0.lastName);
		expect(result.data[0].firstName).to.not.equal(student2.firstName);
		expect(result.data[0].lastName).to.not.equal(student2.lastName);
		expect(result.data[0].firstName).to.not.equal(student3.firstName);
		expect(result.data[0].lastName).to.not.equal(student3.lastName);
	});
});

describe.only('AdminTeachersService', () => {
	let app;
	let adminTeachersService;
	let consentService;
	let server;

	before(async () => {
		app = await appPromise;
		adminTeachersService = app.service('/users/admin/teachers');
		consentService = app.service('consents');
		server = await app.listen(0);
	});

	after((done) => {
		server.close(done);
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	it('is properly registered', () => {
		expect(adminTeachersService).to.not.equal(undefined);
	});

	// https://ticketsystem.schul-cloud.org/browse/SC-5076
	xit('student can not administrate teachers', async () => {
		const student = await testObjects.createTestUser({ roles: ['student'] });
		const params = await testObjects.generateRequestParamsFromUser(student);
		params.query = {};
		try {
			await adminTeachersService.find(params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.message).to.equal(testGenericErrorMessage);
			expect(err.code).to.equal(403);
		}
	});

	// https://ticketsystem.schul-cloud.org/browse/SC-5061
	it('teacher can not find teachers from other schools', async () => {
		const school = await testObjects.createTestSchool({
			name: 'testSchool1',
		});
		const otherSchool = await testObjects.createTestSchool({
			name: 'testSchool2',
		});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id });
		const otherTeacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: otherSchool._id });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = {};
		const resultOk = (
			await adminTeachersService.find({
				account: {
					userId: teacher._id,
				},
				query: {
					account: {
						userId: otherTeacher._id,
					},
				},
			})
		).data;
		const idsOk = resultOk.map((e) => e._id.toString());
		expect(idsOk).not.to.include(otherTeacher._id.toString());
	});

	it('filters teachers correctly', async () => {
		const teacherWithoutConsent = await testObjects.createTestUser({
			birthday: '1992-03-04',
			roles: ['teacher'],
		});
		const teacherWithConsent = await testObjects.createTestUser({
			birthday: '1991-03-04',
			roles: ['teacher'],
		});

		await consentService.create({
			userId: teacherWithConsent._id,
			userConsent: {
				form: 'digital',
				privacyConsent: true,
				termsOfUseConsent: true,
			},
		});

		const createParams = (status) => ({
			account: {
				userId: teacherWithoutConsent._id,
			},
			query: {
				consentStatus: {
					$in: [status],
				},
			},
		});
		const resultMissing = (await adminTeachersService.find(createParams('missing'))).data;
		const idsMissing = resultMissing.map((e) => e._id.toString());
		expect(idsMissing).to.include(teacherWithoutConsent._id.toString());
		expect(idsMissing).to.not.include(teacherWithConsent._id.toString());

		const resultParentsAgreed = (await adminTeachersService.find(createParams('parentsAgreed'))).data;
		expect(resultParentsAgreed).to.be.empty;

		const resultOk = (await adminTeachersService.find(createParams('ok'))).data;
		const idsOk = resultOk.map((e) => e._id.toString());
		expect(idsOk).to.include(teacherWithConsent._id.toString());
		expect(idsOk).to.not.include(teacherWithoutConsent._id.toString());
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
		try {
			await adminTeachersService.create(mockData, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(403);
			expect(err.message).to.equal('Creating new students or teachers is only possible in the source system.');
		}
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
		await adminTeachersService.create(mockData, params);
		// creates second teacher with existent data
		try {
			await adminTeachersService.create(mockData, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(400);
			expect(err.message).to.equal('Email already exists.');
		}
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
		try {
			await adminTeachersService.create(mockData, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(400);
			expect(err.message).to.equal('EMAIL_DOMAIN_BLOCKED');
		}
	});

	it('users with TEACHER_LIST permission can access the FIND method', async () => {
		await testObjects.createTestRole({
			name: 'teacherListPerm',
			permissions: ['TEACHER_LIST'],
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['teacherListPerm'],
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		const { data } = await adminTeachersService.find(params);
		expect(data).to.not.have.lengthOf(0);
	});

	it('users without TEACHER_LIST permission cannot access the FIND method', async () => {
		await testObjects.createTestRole({
			name: 'noTeacherListPerm',
			permissions: [],
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['noTeacherListPerm'],
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);

		try {
			await adminTeachersService.find(params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have one of the permissions: TEACHER_LIST.");
		}
	});

	it('users with TEACHER_LIST permission can access the GET method', async () => {
		await testObjects.createTestRole({
			name: 'teacherListPerm',
			permissions: ['TEACHER_LIST'],
		});
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['teacherListPerm'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		const teacher = await testObjects.createTestUser({
			firstName: 'Affenmesserkamppf',
			roles: ['teacher'],
			schoolId: school._id,
		});

		const user = await adminTeachersService.get(teacher._id, params);
		expect(user.firstName).to.be.equal(teacher.firstName);
	});

	it('users without TEACHER_LIST permission cannot access the GET method', async () => {
		await testObjects.createTestRole({
			name: 'noTeacherListPerm',
			permissions: [],
		});
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['noTeacherListPerm'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id });

		try {
			await adminTeachersService.get(teacher._id, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have one of the permissions: TEACHER_LIST.");
		}
	});

	it('users cannot GET teachers from foreign schools', async () => {
		await testObjects.createTestRole({
			name: 'teacherListPerm',
			permissions: ['TEACHER_LIST'],
		});
		const school = await testObjects.createTestSchool({
			name: 'testSchool1',
		});
		const otherSchool = await testObjects.createTestSchool({
			name: 'testSchool2',
		});
		const testUSer = await testObjects.createTestUser({ roles: ['teacherListPerm'], schoolId: school._id });
		const params = await testObjects.generateRequestParamsFromUser(testUSer);
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: otherSchool._id });
		const user = await adminTeachersService.get(teacher._id, params);
		expect(user).to.be.empty;
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

		try {
			await adminTeachersService.create(teacherData, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have one of the permissions: TEACHER_CREATE.");
		}
	});

	it('users with TEACHER_DELETE permission can access the REMOVE method', async () => {
		await testObjects.createTestRole({
			name: 'teacherDeletePerm',
			permissions: ['TEACHER_CREATE', 'TEACHER_DELETE'],
		});
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['teacherDeletePerm'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		const teacherData = {
			firstName: 'testDeleteTeacher',
			lastName: 'lastTestDeleteTeacher',
			email: 'testDeleteTeacher@de.de',
			roles: ['teacher'],
			schoolId: school._id,
		};
		const teacher = await adminTeachersService.create(teacherData, params);
		params.query = {
			...params.query,
			_ids: [teacher._id],
		};
		const deletedTeacher = await adminTeachersService.remove(null, params);
		expect(deletedTeacher).to.not.be.undefined;
		expect(deletedTeacher.firstName).to.equals('testDeleteTeacher');
	});

	it('users without TEACHER_DELETE permission cannnot access the REMOVE method', async () => {
		await testObjects.createTestRole({
			name: 'noTeacherDeletePerm',
			permissions: ['TEACHER_CREATE'],
		});
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['noTeacherDeletePerm'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		const teacherData = {
			firstName: 'testDeleteTeacher',
			lastName: 'lastDeleteTeacher',
			email: 'testDeleteTeacher2@de.de',
			roles: ['teacher'],
			schoolId: school._id,
		};
		const teacher = await adminTeachersService.create(teacherData, params);
		params.query = {
			...params.query,
			_ids: [],
		};
		try {
			await adminTeachersService.remove(teacher, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have one of the permissions: TEACHER_DELETE.");
		}
	});

	it('users cannot REMOVE teachers from foreign schools', async () => {
		const school = await testObjects.createTestSchool({
			name: 'testSchool1',
		});
		const otherSchool = await testObjects.createTestSchool({
			name: 'testSchool2',
		});
		const testUSer = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
		const params = await testObjects.generateRequestParamsFromUser(testUSer);
		const teacherOne = await testObjects.createTestUser({
			roles: ['teacher'],
			schoolId: otherSchool._id,
		});
		const teacherTwo = await testObjects.createTestUser({
			roles: ['teacher'],
			schoolId: otherSchool._id,
		});
		params.query = {
			...params.query,
			_ids: [teacherOne._id, teacherTwo._id],
		};
		try {
			await adminTeachersService.remove(null, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(403);
			expect(err.message).to.equal('You cannot remove users from other schools.');
		}
	});

	it('REMOVED users should also have their account deleted', async () => {
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['administrator'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);

		const teacherDetails = {
			firstName: 'testDeleteTeacher',
			lastName: 'Tested',
			email: 'testDeleteTeacher@tested.de',
			schoolId: school._id,
		};
		const teacher = await testObjects.createTestUser(teacherDetails);

		const accountDetails = {
			username: 'testDeleteTeacher@tested.de',
			password: 'ca4t9fsfr3dsd',
			userId: teacher._id,
		};
		const teacherAccount = await app.service('/accounts').create(accountDetails);

		params.query = {
			...params.query,
			_ids: [teacher._id],
		};
		const deletedAccount = await app.service('accountModel').get(teacherAccount._id);
		expect(deletedAccount).to.not.be.undefined;
		expect(deletedAccount.username).to.equals(teacherAccount.username);

		const deletedTeacher = await adminTeachersService.remove(null, params);
		expect(deletedTeacher).to.not.be.undefined;
		expect(deletedTeacher.firstName).to.equals('testDeleteTeacher');

		try {
			await app.service('accountModel').get(teacherAccount._id);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(404);
		}
	});

	it('REMOVE requests must include _ids or id', async () => {
		const testUSer = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await testObjects.generateRequestParamsFromUser(testUSer);
		// empty query without _ids key
		params.query = {};
		try {
			await adminTeachersService.remove(null, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(400);
			expect(err.message).to.equal('The request requires either an id or ids to be present.');
		}
	});

	it('_ids must be of array type', async () => {
		const testUSer = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await testObjects.generateRequestParamsFromUser(testUSer);
		params.query = {
			...params.query,
			_ids: 'this is the wrong type',
		};
		try {
			await adminTeachersService.remove(null, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(400);
			expect(err.message).to.equal('The type for ids is incorrect.');
		}
	});

	it('_ids elements must be a valid objectId', async () => {
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUser = await testObjects.createTestUser({
			firstName: 'testUser',
			roles: ['administrator'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUser);
		const teacherData = {
			firstName: 'validDeleteTeacher',
			lastName: 'lastValidDeleteTeacher',
			email: 'validDeleteTeacher@de.de',
			roles: ['teacher'],
			schoolId: school._id,
		};
		const teacher = await adminTeachersService.create(teacherData, params);
		params.query = {
			...params.query,
			_ids: [teacher._id],
		};

		const deletedTeacher = await adminTeachersService.remove(null, params);
		expect(deletedTeacher).to.not.be.undefined;
		expect(deletedTeacher.firstName).to.equals('validDeleteTeacher');

		const otherTeacherData = {
			firstName: 'otherValidDeleteTeacher',
			lastName: 'otherLastValidDeleteTeacher',
			email: 'otherValidDeleteTeacher@de.de',
			roles: ['teacher'],
			schoolId: school._id,
		};
		const otherTeacher = await adminTeachersService.create(otherTeacherData, params);
		params.query = {
			...params.query,
			_ids: [otherTeacher._id, 'wrong type'],
		};

		try {
			await adminTeachersService.remove(null, params);
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err.code).to.equal(400);
			expect(err.message).to.equal('The type for either one or several ids is incorrect.');
		}
	});

	it('id can be both object and string type', async () => {
		const school = await testObjects.createTestSchool({
			name: 'testSchool',
		});
		const testUSer = await testObjects.createTestUser({
			roles: ['administrator'],
			schoolId: school._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(testUSer);
		params.query = {
			...params.query,
			_ids: [],
		};
		const teacherData = {
			firstName: 'testDeleteTeacher',
			lastName: 'lastDeleteTeacher',
			email: 'testDeleteTeacher3@de.de',
			roles: ['teacher'],
			schoolId: school._id,
		};

		const objectTypeTeacherTest = await adminTeachersService.create(teacherData, params);
		const deletedObjectType = await adminTeachersService.remove(objectTypeTeacherTest, params);
		expect(deletedObjectType).to.not.be.undefined;
		expect(deletedObjectType.firstName).to.equals('testDeleteTeacher');

		const stringTypeTeacherTest = await adminTeachersService.create(teacherData, params);
		const deletedeStringType = await adminTeachersService.remove(stringTypeTeacherTest._id, params);
		expect(deletedeStringType).to.not.be.undefined;
		expect(deletedeStringType.firstName).to.equals('testDeleteTeacher');
	});
});
