const chai = require('chai');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise);

const { expect } = chai;

async function createSubmission(
	teachers,
	students,
	publicSubmission = false,
	substitutionTeachers = [],
	courseStudents = [],
	createTeacherPrivateSubmission = false
) {
	const originalTeacher = teachers[0];
	const submitterId = students[0];
	const studentIds = students.map((s) => s._id);
	const courseStudentIds = courseStudents.map((s) => s._id);

	const course = !createTeacherPrivateSubmission
		? await testObjects.createTestCourse({
				teacherIds: teachers.map((t) => t._id),
				substitutionIds: substitutionTeachers.map((s) => s._id),
				userIds: [...new Set([...studentIds, ...courseStudentIds])],
				schoolId: originalTeacher.schoolId,
		  })
		: undefined;

	const courseId = course ? course._id : undefined;
	const homework = await testObjects.createTestHomework({
		teacherId: originalTeacher._id,
		name: 'Testaufgabe',
		description: 'Schreibe ein Essay über Goethes Werk',
		availableDate: Date.now(),
		dueDate: '2030-11-16T12:47:00.000Z',
		private: createTeacherPrivateSubmission,
		archived: [originalTeacher._id],
		lessonId: null,
		courseId,
		publicSubmissions: publicSubmission,
	});
	return testObjects.createTestSubmission({
		schoolId: originalTeacher.schoolId,
		courseId,
		homeworkId: homework._id,
		studentId: submitterId,
		teamMembers: studentIds,
		comment: 'egal wie dicht du bist, Goethe war Dichter.',
	});
}

describe('submission service', function test() {
	let app;
	this.timeout(4000);
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
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
			teacherIds: [teacher._id],
			userIds: [student._id],
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
		params.query = {};
		const result = await app.service('submissions').create(
			{
				schoolId: course.schoolId,
				courseId: course._id,
				homeworkId: homework._id,
				studentId: student._id,
				comment: 'rot! nein, blau!!',
			},
			params
		);
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
		const submission = await createSubmission([teacher], [student]);
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
		const submission = await createSubmission([teacher], [student]);
		const file = await testObjects.createTestFile({ owner: teacher._id, refOwnerModel: 'user' });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		const result = await app
			.service('submissions')
			.patch(submission._id, { grade: 99, gradeFileIds: [file._id] }, params);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('_id');
		expect(result.gradeFileIds.map((id) => id.toString())).to.deep.equal([file._id.toString()]);
		expect(result.grade).to.eq(99);
	});

	it('lets co-teacher grade submission', async () => {
		const [originalTeacher, coTeacher, student] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'] }),
			testObjects.createTestUser({ roles: ['teacher'] }),
			testObjects.createTestUser({ roles: ['student'] }),
		]);
		const submission = await createSubmission([originalTeacher, coTeacher], [student]);
		const params = await testObjects.generateRequestParamsFromUser(coTeacher);
		const result = await app.service('submissions').patch(submission._id, { grade: 0 }, params);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('_id');
		expect(result.grade).to.eq(0);
	});

	it('lets substitution teacher grade submission', async () => {
		const [originalTeacher, substitutionTeacher, student] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'] }),
			testObjects.createTestUser({ roles: ['teacher'] }),
			testObjects.createTestUser({ roles: ['student'] }),
		]);
		const submission = await createSubmission([originalTeacher], [student], false, [substitutionTeacher]);
		const params = await testObjects.generateRequestParamsFromUser(substitutionTeacher);
		const result = await app.service('submissions').patch(submission._id, { grade: 100 }, params);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('_id');
		expect(result.grade).to.eq(100);
	});

	it('teacher can FIND private submissions', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [teacher, student] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		await createSubmission([teacher], [student], false, [], [], true);
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = {};
		const result = await app.service('submissions').find(params);
		expect(result).to.not.be.undefined;
		expect(result.total).to.equal(1);
	});

	it('course teacher can FIND course submissions', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [teacher, student] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		await createSubmission([teacher], [student]);
		const submissionService = app.service('submissions');
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = {};
		const result = await submissionService.find(params);
		expect(result).to.not.be.undefined;
		expect(result.total).to.equal(1);
	});

	it('substitution teacher can FIND course submissions', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [courseTeacher, substitutionTeacher, student] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		await createSubmission([courseTeacher], [student], false, [substitutionTeacher]);
		const submissionService = app.service('submissions');
		const params = await testObjects.generateRequestParamsFromUser(substitutionTeacher);
		params.query = {};
		const result = await submissionService.find(params);
		expect(result).to.not.be.undefined;
		expect(result.total).to.equal(1);
	});

	it('team member can FIND team submissions', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [teacher, submitter, teamMember] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		await createSubmission([teacher], [submitter, teamMember]);
		const submissionService = app.service('submissions');
		const params = await testObjects.generateRequestParamsFromUser(teamMember);
		params.query = {};
		const result = await submissionService.find(params);
		expect(result).to.not.be.undefined;
		expect(result.total).to.equal(1);
	});

	it('team member CAN NOT FIND team submissions of private homework', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [teacher, submitter, teamMember] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		await createSubmission([teacher], [submitter, teamMember], false, [], [], true);
		const submissionService = app.service('submissions');
		const params = await testObjects.generateRequestParamsFromUser(teamMember);
		params.query = {};
		const result = await submissionService.find(params);
		expect(result).to.not.be.undefined;
		expect(result.total).to.equal(0);
	});

	it('course member CAN NOT FIND team submissions of private homework', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [teacher, submitter, courseMember] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		await createSubmission([teacher], [submitter], true, [], [courseMember], true);
		const submissionService = app.service('submissions');
		const params = await testObjects.generateRequestParamsFromUser(courseMember);
		params.query = {};
		const result = await submissionService.find(params);
		expect(result).to.not.be.undefined;
		expect(result.total).to.equal(0);
	});

	it('teacher can NOT FIND all submissions on the school', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [originalTeacher, teacher, student] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		await createSubmission([originalTeacher], [student]);
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = {};
		const result = await app.service('submissions').find(params);
		expect(result).to.not.be.undefined;
		expect(result.total).to.equal(0);
	});

	it('student can NOT FIND other students submissions', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [teacher, student, otherStudent] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		await createSubmission([teacher], [student]);
		const params = await testObjects.generateRequestParamsFromUser(otherStudent);
		params.query = {};
		const result = await app.service('submissions').find(params);
		expect(result).to.not.be.undefined;
		expect(result.total).to.equal(0);
	});

	it('course student can FIND other students public course submissions', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [teacher, student, otherStudent] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		await createSubmission([teacher], [student], true, [], [otherStudent]);
		const submissionService = app.service('submissions');
		const params = await testObjects.generateRequestParamsFromUser(otherStudent);
		params.query = {};
		const result = await submissionService.find(params);
		expect(result).to.not.be.undefined;
		expect(result.total).to.equal(1);
	});

	it('outside student can NOT FIND other students public course submissions', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [teacher, student, otherStudent] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		await createSubmission([teacher], [student], true);
		const submissionService = app.service('submissions');
		const params = await testObjects.generateRequestParamsFromUser(otherStudent);
		params.query = {};
		const result = await submissionService.find(params);
		expect(result).to.not.be.undefined;
		expect(result.total).to.equal(0);
	});

	it('student can NOT GET other students submissions', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [teacher, student, otherStudent] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		const submission = await createSubmission([teacher], [student]);
		const params = await testObjects.generateRequestParamsFromUser(otherStudent);
		params.query = {};
		try {
			await app.service('submissions').get(submission._id, params);
			throw new Error('should have failed.');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed.');
			expect(err.code).to.equal(403);
		}
	});

	it('course teacher can GET course submissions', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [teacher, student] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		const submission = await createSubmission([teacher], [student]);
		const submissionService = app.service('submissions');
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = {};
		const result = await submissionService.get(submission._id, params);
		expect(result).to.haveOwnProperty('_id');
		expect(result.comment).to.eq('egal wie dicht du bist, Goethe war Dichter.');
	});

	it('substitution teacher can GET course submissions', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [courseTeacher, substitutionTeacher, student] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		const submission = await createSubmission([courseTeacher], [student], false, [substitutionTeacher]);
		const submissionService = app.service('submissions');
		const params = await testObjects.generateRequestParamsFromUser(substitutionTeacher);
		params.query = {};
		const result = await submissionService.get(submission._id, params);
		expect(result).to.haveOwnProperty('_id');
		expect(result.comment).to.eq('egal wie dicht du bist, Goethe war Dichter.');
	});

	it('team member can GET team submissions', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [teacher, submitter, teamMember] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		const submission = await createSubmission([teacher], [submitter, teamMember]);
		const submissionService = app.service('submissions');
		const params = await testObjects.generateRequestParamsFromUser(teamMember);
		params.query = {};
		const result = await submissionService.get(submission._id, params);
		expect(result).to.haveOwnProperty('_id');
		expect(result.comment).to.eq('egal wie dicht du bist, Goethe war Dichter.');
	});

	it('course student can GET other students public course submissions', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [teacher, student, otherStudent] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		const submission = await createSubmission([teacher], [student], true, [], [otherStudent]);
		const submissionService = app.service('submissions');
		const params = await testObjects.generateRequestParamsFromUser(otherStudent);
		params.query = {};
		const result = await submissionService.get(submission._id, params);
		expect(result).to.haveOwnProperty('_id');
		expect(result.comment).to.eq('egal wie dicht du bist, Goethe war Dichter.');
	});

	it('outside student can NOT GET other students public course submissions', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const [teacher, student, otherStudent] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
			testObjects.createTestUser({ roles: ['student'], schoolId }),
		]);
		const submission = await createSubmission([teacher], [student], true);
		const params = await testObjects.generateRequestParamsFromUser(otherStudent);
		params.query = {};
		try {
			await app.service('submissions').get(submission._id, params);
			throw new Error('should have failed.');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed.');
			expect(err.code).to.equal(403);
		}
	});
});
