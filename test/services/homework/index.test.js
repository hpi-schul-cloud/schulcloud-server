const assert = require('assert');
const chai = require('chai');
const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);

const homeworkService = app.service('homework');
const homeworkCopyService = app.service('homework/copy');
const { expect } = chai;


describe('homework service', function test() {
	this.timeout(10000);

	it('registered the homework service', () => {
		assert.ok(homeworkService);
		assert.ok(homeworkCopyService);
	});

	const testAufgabe = {
		schoolId: '0000d186816abba584714c5f',
		teacherId: '0000d231816abba584714c9e',
		name: 'Testaufgabe',
		description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
		availableDate: '2017-09-28T11:47:46.622Z',
		dueDate: '2030-11-16T12:47:00.000Z',
		private: true,
		archived: ['0000d231816abba584714c9e'],
		lessonId: null,
		courseId: null,
		updatedAt: '2017-09-28T11:47:46.648Z',
		createdAt: '2017-09-28T11:47:46.648Z',
	};
	it('CREATE task', () => {
		homeworkService.create(testAufgabe)
			.then((result) => {
				expect(result.name).to.equal('Testaufgabe');
			});
	});
	it('DELETE task', () => homeworkService.find({
		query: { name: 'Testaufgabe' },
		account: { userId: '0000d231816abba584714c9e' },
	}).then((result) => {
		expect(result.data.length).to.be.above(0);
		return homeworkService.remove(result.data[0]._id)
			.then(() => true);
	}));

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
			teacherIds: [teacher._id], userIds: [studentOne._id, studentTwo._id],
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
			teacher, students: [studentOne, studentTwo], course, homework, submission,
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
});
