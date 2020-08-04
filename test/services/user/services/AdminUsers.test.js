const { expect } = require('chai');
const logger = require('../../../../src/logger/index');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const adminStudentsService = app.service('/users/admin/students');
const adminTeachersService = app.service('/users/admin/teachers');
const consentService = app.service('consents');

const { equal: equalIds } = require('../../../../src/helper/compare').ObjectId;

const testGenericErrorMessage = 'You have not the permission to execute this.';

describe('AdminUsersService', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
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

		const gradeLevelClass = await testObjects.createTestClass({
			name: 'A',
			userIds: [student._id],
			teacherIds: [teacher._id],
			nameFormat: 'gradeLevel+name',
			gradeLevel: 2,
		}).catch((err) => {
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

		const searchClass = (users, name) => users.some(
			(user) => (equalIds(student._id, user._id) && user.classes.includes(name)),
		);

		expect(result.data).to.not.be.undefined;
		expect(searchClass(result.data, 'staticName')).to.be.true;
		expect(searchClass(result.data, '2A')).to.be.true;
	});

	// https://ticketsystem.schul-cloud.org/browse/SC-5076
	xit('student can not administrate students', async () => {
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
		classPromises.push(testObjects.createTestClass({
			name: 'classFromThisYear',
			userIds: [student._id],
			teacherIds: [teacher._id],
			year: currentYear,
		}));
		classPromises.push(testObjects.createTestClass({
			name: 'classFromLastYear',
			userIds: [student._id],
			teacherIds: [teacher._id],
			year: lastYear,
		}));
		classPromises.push(testObjects.createTestClass({
			name: 'classWithoutYear',
			userIds: [student._id],
			teacherIds: [teacher._id],
		}));

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
		const student1 = await testObjects.createTestUser({
			firstName: 'Max',
			roles: ['student'],
		}).catch((err) => {
			logger.warning('Can not create student', err);
		});
		const student2 = await testObjects.createTestUser({
			firstName: 'Moritz',
			roles: ['student'],
		}).catch((err) => {
			logger.warning('Can not create student', err);
		});

		await testObjects.createTestConsent({
			userId: student1._id,
			userConsent: {
				form: 'digital',
				privacyConsent: true,
				termsOfUseConsent: true,
			},
			parentConsents: [{
				form: 'digital',
				privacyConsent: true,
				termsOfUseConsent: true,
			}],
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
		});

		await testObjects.createTestConsent({
			userId: studentWithParentConsent._id,
			parentConsents: [{
				form: 'digital',
				privacyConsent: true,
				termsOfUseConsent: true,
			}],
		});

		const studentWithConsents = await testObjects.createTestUser({ roles: ['student'] });

		await testObjects.createTestConsent({
			userId: studentWithConsents._id,
			userConsent: {
				form: 'digital',
				privacyConsent: true,
				termsOfUseConsent: true,
			},
			parentConsents: [{
				form: 'digital',
				privacyConsent: true,
				termsOfUseConsent: true,
			}],
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
		expect(idsParentsAgreed).to.not.include(
			studentWithoutConsents._id.toString(),
			studentWithConsents._id.toString(),
		);

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

	after(async () => {
		await testObjects.cleanup();
	});
});

describe('AdminTeachersService', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
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
		const resultOk = (await adminTeachersService.find({
			account: {
				userId: teacher._id,
			},
			query: {
				account: {
					userId: otherTeacher._id,
				},
			},
		})).data;
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

	after(async () => {
		await testObjects.cleanup();
	});
});
