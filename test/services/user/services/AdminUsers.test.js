const { expect } = require('chai');
const logger = require('winston');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const adminStudentsService = app.service('/users/admin/students');
const adminTeachersService = app.service('/users/admin/teachers');
const gradeLevelService = app.service('/gradeLevels');
const consentService = app.service('consents');

describe('AdminStudentsService', () => {
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
			logger.warn('Can not create teacher', err);
		});
		const student = await testObjects.createTestUser({ roles: ['student'] }).catch((err) => {
			logger.warn('Can not create student', err);
		});

		expect(teacher).to.not.be.undefined;
		expect(student).to.not.be.undefined;

		const testClass = await testObjects.createTestClass({
			name: 'staticName',
			userIds: [student._id],
			teacherIds: [teacher._id],
		});
		expect(testClass).to.not.be.undefined;

		const gradeLevel = await gradeLevelService.find({
			query: { name: '2' },
		}).then(gradeLevels => gradeLevels.data[0]).catch((err) => {
			logger.warn('Can not find gradeLevel', err);
		});
		expect(gradeLevel).to.not.be.undefined;

		const gradeLevelClass = await testObjects.createTestClass({
			name: 'A',
			userIds: [student._id],
			teacherIds: [teacher._id],
			nameFormat: 'gradeLevel+name',
			gradeLevel: gradeLevel._id,
		}).catch((err) => {
			logger.warn('Can not create test class.', err);
		});
		expect(gradeLevelClass).to.not.be.undefined;

		const params = {
			account: {
				userId: teacher._id,
			},
		};

		const result = await adminStudentsService.find(params).catch((err) => {
			logger.warn('Can not execute adminStudentsService.find.', err);
		});

		const searchClass = (users, name) => users.some(
			user => student._id.toString() === user._id.toString() && user.classes.includes(name),
		);

		expect(result).to.not.be.undefined;
		expect(searchClass(result, 'staticName')).to.be.true;
		expect(searchClass(result, '2A')).to.be.true;
	});

	it('sorts students correctly', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		await testObjects.createTestUser({ firstName: 'Max', roles: ['student'] });
		await testObjects.createTestUser({ firstName: 'Moritz', roles: ['student'] });

		const params = {
			account: {
				userId: teacher._id,
			},
			$sort: {
				firstName: -1,
			},
		};
		const result = await adminStudentsService.find(params);

		expect(result[0].firstName > result[1].firstName);
	});

	it('filters students correctly', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const studentWithoutConsents = await testObjects.createTestUser({ roles: ['student'] });
		const studentWithParentConsent = await testObjects.createTestUser({
			roles: ['student'],
			birthday: '2010-01-01',
		});
		const studentWithConsents = await testObjects.createTestUser({ roles: ['student'] });

		await consentService.create({
			userId: studentWithParentConsent._id,
			parentConsents: [{
				privacyConsent: true,
				termsOfUseConsent: true,
			}],
		});

		await consentService.create({
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

		const createParams = status => ({
			account: {
				userId: teacher._id,
			},
			query: {
				consentStatus: {
					$in: [status],
				},
			},
		});

		const resultMissing = await adminStudentsService.find(createParams('missing'));
		const idsMissing = resultMissing.map(e => e._id);
		expect(idsMissing).to.include(studentWithoutConsents._id);
		expect(idsMissing).to.not.include(studentWithParentConsent._id, studentWithConsents._id);

		const resultParentsAgreed = await adminStudentsService.find(createParams('parentsAgreed'));
		const idsParentsAgreed = resultParentsAgreed.map(e => e._id);
		expect(idsParentsAgreed).to.include(studentWithParentConsent._id);
		expect(idsParentsAgreed).to.not.include(studentWithoutConsents._id, studentWithConsents._id);

		const resultOk = await adminStudentsService.find(createParams('ok'));
		const idsOk = resultOk.map(e => e._id);
		expect(idsOk).to.include(studentWithConsents._id);
		expect(idsOk).to.not.include(studentWithoutConsents._id, studentWithParentConsent._id);
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

		const createParams = status => ({
			account: {
				userId: teacherWithoutConsent._id,
			},
			query: {
				consentStatus: {
					$in: [status],
				},
			},
		});

		const resultMissing = await adminTeachersService.find(createParams('missing'));
		const idsMissing = resultMissing.map(e => e._id);
		expect(idsMissing).to.include(teacherWithoutConsent._id);
		expect(idsMissing).to.not.include(teacherWithConsent._id);

		const resultParentsAgreed = await adminTeachersService.find(createParams('parentsAgreed'));
		expect(resultParentsAgreed).to.be.empty;

		const resultOk = await adminTeachersService.find(createParams('ok'));
		const idsOk = resultOk.map(e => e._id);
		expect(idsOk).to.include(teacherWithConsent._id);
		expect(idsOk).to.not.include(teacherWithoutConsent._id);
	});

	after(async () => {
		await testObjects.cleanup();
	});
});
