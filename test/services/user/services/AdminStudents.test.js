const { expect } = require('chai');
const logger = require('winston');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const adminStudentsService = app.service('/users/admin/students');
const gradeLevelService = app.service('/gradeLevels');

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

	after(async () => {
		await testObjects.cleanup();
	});
});
