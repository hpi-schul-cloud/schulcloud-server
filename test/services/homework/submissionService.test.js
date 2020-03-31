const assert = require('assert');
const chai = require('chai');
const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);

const { expect } = chai;

const oneWeekInMilliseconds = 6.048e+8;

describe.only('submission service', function test() {
	this.timeout(10000);
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after(async () => {
		await server.close();
	});

	it('lets student add a submission', async () => {
		const [teacher, student] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'] }),
			testObjects.createTestUser({ roles: ['student'] }),
		]);
		const course = await testObjects.createTestCourse({
			teacherIds: [teacher._id], userIds: [student._id],
		});
		const homework = await testObjects.createTestHomework({
			teacherId: teacher._id,
			name: 'Testaufgabe',
			description: 'was ist deine Lieblingsfarbe?',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: false,
			archived: [teacher._id],
			lessonId: null,
			courseId: course._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(student);
		const result = await app.service('submissions').create({
			schoolId: course.schoolId,
			courseId: course._id,
			homeworkId: homework._id,
			studentId: student._id,
			comment: 'rot! nein, blau!!',
		}, params);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('_id');
		expect(result.teamMembers.length).to.equal(1);
		expect(result.teamMembers[0].toString()).to.equal(student._id.toString());
		expect(result.comment).to.eq('rot! nein, blau!!');
	});

	it('lets teacher grade submission', async () => {
		const [teacher, student] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'] }),
			testObjects.createTestUser({ roles: ['student'] }),
		]);
		const course = await testObjects.createTestCourse({
			teacherIds: [teacher._id], userIds: [student._id],
		});
		const homework = await testObjects.createTestHomework({
			teacherId: teacher._id,
			name: 'Testaufgabe',
			description: 'was ist die durchschnittsgeschwindigkeit einer Schwalbe?',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: false,
			archived: [teacher._id],
			lessonId: null,
			courseId: course._id,
		});
		const submission = await testObjects.createTestSubmission({
			schoolId: course.schoolId,
			courseId: course._id,
			homeworkId: homework._id,
			studentId: student._id,
			comment: 'einer amerikanischen oder einer afrikanischen?',
		});
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		const result = await app.service('submissions').patch(submission._id, { grade: 99 }, params);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('_id');
		expect(result.grade).to.eq(99);
	});
});
