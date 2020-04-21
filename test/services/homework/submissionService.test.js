const chai = require('chai');
const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);

const { expect } = chai;

describe('submission service', function test() {
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
		params.query = {}
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

	it('lets teachers upload files to grade submissions', async () => {
		const [teacher, student] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'] }),
			testObjects.createTestUser({ roles: ['student'] }),
		]);
		const course = await testObjects.createTestCourse({
			teacherIds: [teacher._id],
			userIds: [student._id],
		});
		const homework = await testObjects.createTestHomework({
			teacherId: teacher._id,
			name: 'Testaufgabe',
			description: 'Was ist die Durchschnittsgeschwindigkeit einer europäischen Schwalbe?',
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
			comment: '11 Meter pro Sekunde',
		});
		const file = await testObjects.createTestFile({ owner: teacher._id, refOwnerModel: 'user' });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		const result = await app
			.service('submissions')
			.patch(submission._id, { grade: 99, gradeFileIds: [file._id] }, params);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('_id');
		expect(result.gradeFileIds[0].toString()).to.equal(file._id.toString());
		expect(result.grade).to.eq(99);
	});

	it('lets co-teacher grade submission', async () => {
		const [originalTeacher, coTeacher, student] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'] }),
			testObjects.createTestUser({ roles: ['teacher'] }),
			testObjects.createTestUser({ roles: ['student'] }),
		]);
		const course = await testObjects.createTestCourse({
			teacherIds: [originalTeacher._id, coTeacher._id], userIds: [student._id],
		});
		const homework = await testObjects.createTestHomework({
			teacherId: originalTeacher._id,
			name: 'Testaufgabe',
			description: 'Wo würdest du suchen, wenn du einen Bezuar beschaffen müsstest?',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: false,
			archived: [originalTeacher._id],
			lessonId: null,
			courseId: course._id,
		});
		const submission = await testObjects.createTestSubmission({
			schoolId: course.schoolId,
			courseId: course._id,
			homeworkId: homework._id,
			studentId: student._id,
			comment: 'Ich weis nicht, Sir.',
		});
		const params = await testObjects.generateRequestParamsFromUser(coTeacher);
		const result = await app.service('submissions').patch(submission._id, { grade: 0 }, params);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('_id');
		expect(result.grade).to.eq(0);
	});

	it('lets substitution teacher grade submission', async () => {
		const [originalTeacher, coTeacher, student] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'] }),
			testObjects.createTestUser({ roles: ['teacher'] }),
			testObjects.createTestUser({ roles: ['student'] }),
		]);
		const course = await testObjects.createTestCourse({
			teacherIds: [originalTeacher._id, coTeacher._id], userIds: [student._id],
		});
		const homework = await testObjects.createTestHomework({
			teacherId: originalTeacher._id,
			name: 'Testaufgabe',
			description: 'Addiere alle Zahlen von 1-100',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: false,
			archived: [originalTeacher._id],
			lessonId: null,
			courseId: course._id,
		});
		const submission = await testObjects.createTestSubmission({
			schoolId: course.schoolId,
			courseId: course._id,
			homeworkId: homework._id,
			studentId: student._id,
			comment: '5050',
		});
		const params = await testObjects.generateRequestParamsFromUser(coTeacher);
		const result = await app.service('submissions').patch(submission._id, { grade: 100 }, params);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('_id');
		expect(result.grade).to.eq(100);
	});

	it('teacher can FIND all submissions on the school', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [originalTeacher, teacher , student] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		const course = await testObjects.createTestCourse({
			teacherIds: [originalTeacher._id], userIds: [student._id], schoolId,
		});
		const homework = await testObjects.createTestHomework({
			teacherId: originalTeacher._id,
			name: 'Testaufgabe',
			description: 'Schreibe ein Essay über Goethes Werk',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: false,
			archived: [originalTeacher._id],
			lessonId: null,
			courseId: course._id,
			schoolId,
		});
		await testObjects.createTestSubmission({
			schoolId,
			courseId: course._id,
			homeworkId: homework._id,
			studentId: student._id,
			comment: 'egal wie dicht du bist, Goethe war Dichter.',
		});
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = {};
		const result = await app.service('submissions').find(params);
		expect(result).to.not.be.undefined;
		expect(result.total).to.equal(1);
	});

	it('student can not FIND other students submissions', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [teacher, otherStudent, student] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		const course = await testObjects.createTestCourse({
			teacherIds: [teacher._id], userIds: [student._id], schoolId,
		});
		const homework = await testObjects.createTestHomework({
			teacherId: teacher._id,
			name: 'Testaufgabe',
			description: 'Schreibe ein Essay über Goethes Werk',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: false,
			archived: [teacher._id],
			lessonId: null,
			courseId: course._id,
			schoolId,
		});
		await testObjects.createTestSubmission({
			schoolId,
			courseId: course._id,
			homeworkId: homework._id,
			studentId: student._id,
			comment: 'egal wie dicht du bist, Goethe war Dichter.',
		});
		const params = await testObjects.generateRequestParamsFromUser(otherStudent);
		params.query = {};
		const result = await app.service('submissions').find(params);
		expect(result).to.not.be.undefined;
		expect(result.total).to.equal(0);
	});
});
