const assert = require('assert');
const chai = require('chai');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise);

const { expect } = chai;

describe('homework service', function test() {
	let app = appPromise;
	let homeworkService;
	let homeworkCopyService;
	let server;
	this.timeout(10000);

	before((done) => {
		server = app.listen(0, done);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	before(async () => {
		app = appPromise;
		homeworkService = app.service('homework');
		homeworkCopyService = app.service('homework/copy');
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
	});

	it('registered the homework service', () => {
		assert.ok(homeworkService);
		assert.ok(homeworkCopyService);
	});

	describe('CREATE', () => {
		it('can create a simple private homework', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const params = await testObjects.generateRequestParamsFromUser(user);
			const hw = await homeworkService.create(
				{
					teacherId: user._id,
					name: 'Testaufgabe',
					description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
					availableDate: '2017-09-28T11:47:46.622Z',
					dueDate: '2030-11-16T12:47:00.000Z',
					private: true,
				},
				params
			);
			expect(hw).to.haveOwnProperty('_id');
		});

		it('can not create homework for foreign school', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const { _id: foreignSchoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const params = await testObjects.generateRequestParamsFromUser(user);
			const hw = await homeworkService.create(
				{
					schoolId: foreignSchoolId,
					teacherId: user._id,
					name: 'Testaufgabe',
					description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
					availableDate: '2017-09-28T11:47:46.622Z',
					dueDate: '2030-11-16T12:47:00.000Z',
					private: true,
				},
				params
			);
			expect(hw).to.haveOwnProperty('_id');
			expect(hw.schoolId.toString()).to.not.equal(foreignSchoolId.toString());
			expect(hw.schoolId.toString()).to.equal(schoolId.toString());
		});

		it('can not create homework for course the user is not in', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const { _id: courseId } = await testObjects.createTestCourse();
			const params = await testObjects.generateRequestParamsFromUser(user);
			const data = {
				teacherId: user._id,
				name: 'Testaufgabe',
				description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
				availableDate: '2017-09-28T11:47:46.622Z',
				dueDate: '2030-11-16T12:47:00.000Z',
				courseId,
			};
			try {
				await homeworkService.create(data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(404);
				expect(err.message).to.equal('course not found');
			}
		});

		it('student can create todo for himself', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const params = await testObjects.generateRequestParamsFromUser(user);
			const hw = await homeworkService.create(
				{
					name: 'Testaufgabe',
					description: 'Müll rausbringen',
					availableDate: '2017-09-28T11:47:46.622Z',
					dueDate: `${Date.now()}`,
				},
				params
			);
			expect(hw).to.haveOwnProperty('_id');
			expect(hw.teacherId.toString()).to.equal(user._id.toString());
			expect(hw.private).to.equal(true);
			expect(hw.schoolId.toString()).to.equal(user.schoolId.toString());
		});

		it('student can not create homework on a course', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const { _id: courseId } = await testObjects.createTestCourse({ userIds: [user._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);
			const hw = await homeworkService.create(
				{
					name: 'Testaufgabe',
					description: 'Müll rausbringen',
					availableDate: '2017-09-28T11:47:46.622Z',
					dueDate: `${Date.now()}`,
					private: false,
					courseId,
				},
				params
			);
			expect(hw).to.haveOwnProperty('_id');
			expect(hw.courseId).to.equal(null); // default value in the database
		});
	});

	it('DELETE task', async () => {
		const user = await testObjects.createTestUser({ roles: ['teacher'] });
		const homework = await testObjects.createTestHomework({
			teacherId: user._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: true,
			archived: [user._id],
			lessonId: null,
			courseId: null,
		});
		const params = await testObjects.generateRequestParamsFromUser(user);
		params.query = {};
		const result = await homeworkService.remove(homework._id, params);
		expect(result).to.not.be.undefined;
		try {
			await homeworkService.get(homework._id);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.eq(404);
		}
	});

	it('FIND only my own tasks', async () => {
		const user = await testObjects.createTestUser({ roles: ['teacher'] });
		await testObjects.createTestHomework({
			teacherId: user._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: true,
			archived: [user._id],
			lessonId: null,
			courseId: null,
		});
		const params = await testObjects.generateRequestParamsFromUser(user);
		params.query = {};
		const result = await homeworkService.find(params);
		expect(result.total).to.be.above(0);
		expect(result.data.filter((e) => e.teacherId.toString() !== user._id.toString()).length).to.equal(0);
	});

	it('try to FIND tasks of others', async () => {
		const user = await testObjects.createTestUser({ roles: ['teacher'] });
		const otherUser = await testObjects.createTestUser({ roles: ['teacher'] });
		await testObjects.createTestHomework({
			teacherId: otherUser._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: true,
			archived: [otherUser._id],
			lessonId: null,
			courseId: null,
		});
		const params = await testObjects.generateRequestParamsFromUser(user);
		params.query = {
			teacherId: otherUser._id,
			private: true,
		};
		const result = await homeworkService.find(params);
		expect(result.total).to.equal(0);
	});

	const setupHomeworkWithGrades = async () => {
		const [teacher, studentOne, studentTwo] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'] }),
			testObjects.createTestUser({ roles: ['student'] }),
			testObjects.createTestUser({ roles: ['student'] }),
		]);
		const course = await testObjects.createTestCourse({
			teacherIds: [teacher._id],
			userIds: [studentOne._id, studentTwo._id],
		});
		const homework = await testObjects.createTestHomework({
			teacherId: teacher._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
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
			studentId: studentOne._id,
			comment: 'hello teacher, my dog has eaten this database entry...',
			grade: 67,
		});
		return {
			teacher,
			students: [studentOne, studentTwo],
			course,
			homework,
			submission,
		};
	};

	it('contains statistics as a teacher', async () => {
		const { homework, teacher } = await setupHomeworkWithGrades();
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = { _id: homework._id };
		const result = await homeworkService.find(params);

		expect(result.data[0].stats.userCount).to.equal(2);
		expect(result.data[0].stats.submissionCount).to.equal(1);
		expect(result.data[0].stats.submissionPercentage).to.equal('50.00');
		expect(result.data[0].stats.gradeCount).to.equal(1);
		expect(result.data[0].stats.gradePercentage).to.equal('50.00');
		expect(result.data[0].stats.averageGrade).to.equal('67.00');
		// no grade as a teacher
		expect(result.data[0].grade).to.equal(undefined);
	});

	it('contains grade as a student', async () => {
		const { students, homework } = await setupHomeworkWithGrades();
		const params = await testObjects.generateRequestParamsFromUser(students[0]);
		params.query = { _id: homework._id };
		const result = await homeworkService.find(params);
		expect(result.data[0].grade).to.equal('67.00');
		// no stats as a student
		expect(result.data[0].stats).to.equal(undefined);
	});

	it('contains statistics as students when publicSubmissions:true', async () => {
		const { students, homework } = await setupHomeworkWithGrades();
		await app.service('homework').patch(homework._id, { publicSubmissions: true });
		const params = await testObjects.generateRequestParamsFromUser(students[0]);
		params.query = { _id: homework._id };
		const result = await homeworkService.find(params);
		expect(result.data[0].grade).to.equal('67.00');
		// no stats as a student
		expect(result.data[0].stats).to.not.equal(undefined);
	});

	it('teacher can PATCH his own homework', async () => {
		const [teacher] = await Promise.all([testObjects.createTestUser({ roles: ['teacher'] })]);
		const course = await testObjects.createTestCourse({
			teacherIds: [teacher._id],
			userIds: [],
		});
		const homework = await testObjects.createTestHomework({
			teacherId: teacher._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: false,
			archived: [teacher._id],
			lessonId: null,
			courseId: course._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		const result = await app
			.service('homework')
			.patch(homework._id, { description: 'bringe mir 12 Wolfspelze!' }, params);
		expect(result).to.not.be.undefined;
		expect(result.description).to.equal('bringe mir 12 Wolfspelze!');
	});

	it('teacher can PATCH another teachers homework in the same course', async () => {
		const [teacher, actingTeacher] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'] }),
			testObjects.createTestUser({ roles: ['teacher'] }),
		]);
		const course = await testObjects.createTestCourse({
			teacherIds: [teacher._id, actingTeacher._id],
			userIds: [],
		});
		const homework = await testObjects.createTestHomework({
			teacherId: teacher._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: false,
			archived: [teacher._id],
			lessonId: null,
			courseId: course._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(actingTeacher);
		const result = await app
			.service('homework')
			.patch(homework._id, { description: 'wirf den Ring ins Feuer!' }, params);
		expect(result).to.not.be.undefined;
		expect(result.description).to.equal('wirf den Ring ins Feuer!');
	});

	it('substitution teacher can PATCH another teachers homework in the same course', async () => {
		const [teacher, actingTeacher] = await Promise.all([
			testObjects.createTestUser({ roles: ['teacher'] }),
			testObjects.createTestUser({ roles: ['teacher'] }),
		]);
		const course = await testObjects.createTestCourse({
			teacherIds: [teacher._id],
			substitutionIds: [actingTeacher._id],
		});
		const homework = await testObjects.createTestHomework({
			teacherId: teacher._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: false,
			archived: [teacher._id],
			lessonId: null,
			courseId: course._id,
		});
		const params = await testObjects.generateRequestParamsFromUser(actingTeacher);
		const result = await app.service('homework').patch(homework._id, { description: 'zeichne mir ein Schaf!' }, params);
		expect(result).to.not.be.undefined;
		expect(result.description).to.equal('zeichne mir ein Schaf!');
	});
});
