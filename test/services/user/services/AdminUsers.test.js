const { expect } = require('chai');
const logger = require('../../../../src/logger/index');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const adminStudentsService = app.service('/users/admin/students');
const adminTeachersService = app.service('/users/admin/teachers');
const consentService = app.service('consents');

const { equal: equalIds } = require('../../../../src/helper/compare').ObjectId;


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
			$sort: sortObject,
		});

		const resultSortedByFirstName = await adminStudentsService.find(createParams({ firstName: -1 }));
		expect(resultSortedByFirstName.data.lenght > 1);
		expect(resultSortedByFirstName.data[0].firstName > resultSortedByFirstName.data[1].firstName);

		const resultSortedByClass = await adminStudentsService.find(createParams({ class: -1 }));
		expect(resultSortedByClass.data[0].class > resultSortedByClass.data[1].class);


		const sortOrder = {
			missing: 1,
			parentsAgreed: 2,
			ok: 3,
		};

		const resultSortedByConsent = await adminStudentsService.find(createParams({ consent: -1 }));
		expect(sortOrder[resultSortedByConsent.data[0].consent.consentStatus])
			.to.be.at.least(sortOrder[resultSortedByConsent.data[1].consent.consentStatus]);
	});

	it('filters students correctly', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const studentWithoutConsents = await testObjects.createTestUser({ roles: ['student'] });
		const studentWithParentConsent = await testObjects.createTestUser({
			roles: ['student'],
			birthday: '2010-01-01',
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

	it('filters teachers correctly', async () => {
		const teacherWithoutConsent = await testObjects.createTestUser({ roles: ['teacher'] });
		const teacherWithConsent = await testObjects.createTestUser({ roles: ['teacher'] });

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
