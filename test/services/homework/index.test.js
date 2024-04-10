const assert = require('assert');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise());

chai.use(chaiAsPromised);
const { expect } = chai;

const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');
const { NotAuthenticated } = require('../../../src/errors');

describe('homework service', () => {
	let app;
	let homeworkService;
	let server;
	let nestServices;
	// let lessonService;

	const setupPrivateHomework = async () => {
		const user = await testObjects.createTestUser({ roles: ['teacher'] });
		const homework = await testObjects.createTestHomework({
			teacherId: user._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: true,
			lessonId: null,
			courseId: null,
		});
		return { user, homework };
	};

	const setupHomeworkWithCourse = async ({ asPrivate = false } = {}) => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const substitutionTeacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const owner = await testObjects.createTestUser({ roles: ['teacher'] });
		const student = await testObjects.createTestUser({ roles: ['student'] });
		const course = await testObjects.createTestCourse({
			teacherIds: [teacher._id, owner._id],
			substitutionIds: [substitutionTeacher._id],
			userIds: [student._id],
		});
		const homework = await testObjects.createTestHomework({
			teacherId: owner._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: asPrivate,
			archived: [],
			lessonId: null,
			courseId: course._id,
		});

		return {
			teacher,
			substitutionTeacher,
			owner,
			student,
			course,
			homework,
		};
	};

	before(async () => {
		app = await appPromise();
		homeworkService = app.service('homework');
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	it('registered the homework service', () => {
		assert.ok(homeworkService);
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

		it('can create a simple homework for a lesson', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const { _id: courseId } = await testObjects.createTestCourse({ schoolId, teacherIds: [user._id] });
			const { _id: lessonId } = await testObjects.createTestLesson({ courseId, schoolId });
			const params = await testObjects.generateRequestParamsFromUser(user);
			const hw = await homeworkService.create(
				{
					teacherId: user._id,
					name: 'Testaufgabe',
					description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
					availableDate: '2017-09-28T11:47:46.622Z',
					dueDate: '2030-11-16T12:47:00.000Z',
					private: true,
					courseId,
					lessonId,
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

		it('student can not create todo for himself', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const params = await testObjects.generateRequestParamsFromUser(user);
			const data = {
				name: 'Testaufgabe',
				description: 'Müll rausbringen',
				availableDate: '2017-09-28T11:47:46.622Z',
				dueDate: `${Date.now()}`,
			};
			try {
				await homeworkService.create(data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal("You don't have one of the permissions: HOMEWORK_CREATE.");
			}
		});

		it('student can not create homework on a course', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const { _id: courseId } = await testObjects.createTestCourse({ userIds: [user._id] });
			const params = await testObjects.generateRequestParamsFromUser(user);
			const data = {
				name: 'Testaufgabe',
				description: 'Müll rausbringen',
				availableDate: '2017-09-28T11:47:46.622Z',
				dueDate: `${Date.now()}`,
				private: false,
				courseId,
			};
			try {
				await homeworkService.create(data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal("You don't have one of the permissions: HOMEWORK_CREATE.");
			}
		});
	});

	describe('DELETE', async () => {
		it('should not allow homework removal', async () => {
			const { homework, teacher } = await setupHomeworkWithCourse();
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = {};
			expect(homeworkService.remove(homework._id, params)).to.be.rejectedWith(NotAuthenticated);
		});
	});

	describe('FIND', () => {
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
				submitted: true,
				graded: true,
			});
			return {
				teacher,
				students: [studentOne, studentTwo],
				course,
				homework,
				submission,
			};
		};

		it('as a teacher, I am be able to FIND my own private tasks', async () => {
			const { user: teacher } = await setupPrivateHomework();
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = {};
			const result = await homeworkService.find(params);
			expect(result.total).to.equal(1);
			expect(result.data.filter((e) => e.teacherId.toString() !== teacher._id.toString()).length).to.equal(0);
		});

		it('as a teacher, I am able to FIND tasks in my courses', async () => {
			const { teacher } = await setupHomeworkWithCourse();
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = {};
			const result = await homeworkService.find(params);
			expect(result.total).to.equal(1);
		});

		it('as a teacher, I am able to FIND private tasks in my courses', async () => {
			const { teacher } = await setupHomeworkWithCourse({ asPrivate: true });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = {};
			const result = await homeworkService.find(params);
			expect(result.total).to.equal(1);
		});

		it('as a substitution teacher, I am able to FIND tasks in my courses', async () => {
			const { substitutionTeacher } = await setupHomeworkWithCourse();
			const params = await testObjects.generateRequestParamsFromUser(substitutionTeacher);
			params.query = {};
			const result = await homeworkService.find(params);
			expect(result.total).to.equal(1);
		});

		it('as a substitution teacher, I am able to FIND private tasks in my courses', async () => {
			const { substitutionTeacher } = await setupHomeworkWithCourse({ asPrivate: true });
			const params = await testObjects.generateRequestParamsFromUser(substitutionTeacher);
			params.query = {};
			const result = await homeworkService.find(params);
			expect(result.total).to.equal(1);
		});

		it('as a teacher, I am not able to FIND private tasks of others outside my courses', async () => {
			await setupPrivateHomework();
			const teacher = await testObjects.createTestUser({ roles: ['teacher'] });

			const params = await testObjects.generateRequestParamsFromUser(teacher);
			const result = await homeworkService.find(params);
			expect(result.total).to.equal(0);
		});

		it('as a student, I am able to FIND tasks in my courses', async () => {
			const { student } = await setupHomeworkWithCourse();
			const params = await testObjects.generateRequestParamsFromUser(student);
			const result = await homeworkService.find(params);
			expect(result.total).to.equal(1);
		});

		it('as a student, I am not able to FIND private tasks in my courses', async () => {
			const { student } = await setupHomeworkWithCourse({ asPrivate: true });
			const params = await testObjects.generateRequestParamsFromUser(student);
			const result = await homeworkService.find(params);
			expect(result.total).to.equal(0);
		});

		it('as a student, I am not able to FIND tasks of others', async () => {
			await setupHomeworkWithCourse();
			const student = await testObjects.createTestUser({ roles: ['student'] });
			const params = await testObjects.generateRequestParamsFromUser(student);
			const result = await homeworkService.find(params);
			expect(result.total).to.equal(0);
		});

		it('teacher sees homework statistics', async () => {
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

		it('student sees grade but no stats', async () => {
			const { students, homework } = await setupHomeworkWithGrades();

			const params = await testObjects.generateRequestParamsFromUser(students[0]);
			params.query = { _id: homework._id };
			const result = await homeworkService.find(params);
			expect(result.data[0].grade).to.equal('67.00');
			// no stats as a student
			expect(result.data[0].stats).to.equal(undefined);
		});

		it('student sees if he submitted or not', async () => {
			const { students, course, homework } = await setupHomeworkWithGrades();
			await testObjects.createTestSubmission({
				schoolId: course.schoolId,
				courseId: course._id,
				homeworkId: homework._id,
				studentId: students[1]._id,
				comment: 'hello teacher, his dog has eaten this database entry also...',
				grade: 67,
				submitted: true,
				graded: true,
			});

			const params = await testObjects.generateRequestParamsFromUser(students[0]);
			params.query = { _id: homework._id };
			const result = await homeworkService.find(params);
			expect(result.data[0].submissions).to.equal(1);
		});

		it('homework contains course details', async () => {
			const { teacher, course } = await setupHomeworkWithCourse();
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = {};
			const result = await homeworkService.find(params);

			expect(course._id.toString()).to.equal(result.data[0].courseId._id.toString());

			const schoolId = result.data[0].schoolId.toString();
			const courseSchoolId = result.data[0].courseId.schoolId.toString();
			expect(schoolId).to.equal(courseSchoolId);
		});

		const createHomeworkWithSubmissions = async (teacherId, studentIds = [], courseId) => {
			const { _id: homeworkId } = await testObjects.createTestHomework({
				teacherId,
				name: 'Testaufgabe',
				description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
				availableDate: Date.now(),
				dueDate: Date.now() + 86400000,
				lessonId: null,
				courseId,
			});
			const submissionPromises = [];
			studentIds.forEach((studentId) => {
				submissionPromises.push(
					testObjects.createTestSubmission({
						homeworkId,
						studentId,
						comment: 'I dont know the answer',
						submitted: true,
						graded: true,
					})
				);
			});
			await Promise.all(submissionPromises);
		};
		it('does not paginate the submissions', async () => {
			const { _id: teacherId } = await testObjects.createTestUser({ roles: ['teacher'] });
			const student = await testObjects.createTestUser({ roles: ['student'] });
			const otherStudentPromises = [];
			for (let i = 0; i < 25; i += 1) {
				otherStudentPromises.push(testObjects.createTestUser({ roles: ['student'] }));
			}
			let otherStudents = await Promise.all(otherStudentPromises);
			otherStudents = otherStudents.map((s) => s._id);
			const { _id: courseId } = await testObjects.createTestCourse({
				teacherIds: [teacherId],
				userIds: [student._id, ...otherStudents],
			});

			const homeworkPromises = [];
			for (let i = 0; i < 50; i += 1) {
				homeworkPromises.push(createHomeworkWithSubmissions(teacherId, [student._id, ...otherStudents], courseId));
			}
			await Promise.all(homeworkPromises);

			const params = await testObjects.generateRequestParamsFromUser(student);
			const result = await homeworkService.find(params);

			expect(result.data.length).to.equal(50);
			result.data.forEach((homework) => {
				expect(homework.submissions).to.equal(1);
			});
		});
	});

	describe('GET', () => {
		it('as a Teacher, I am able to GET a task in my course', async () => {
			const { teacher, homework } = await setupHomeworkWithCourse();

			const params = await testObjects.generateRequestParamsFromUser(teacher);
			const result = await homeworkService.get(homework._id, params);
			expect(result.name).to.equal('Testaufgabe');
		});

		it('as a Teacher, I am able to GET a private task in my course', async () => {
			const { teacher, homework } = await setupHomeworkWithCourse({ asPrivate: true });

			const params = await testObjects.generateRequestParamsFromUser(teacher);
			const result = await homeworkService.get(homework._id, params);
			expect(result.name).to.equal('Testaufgabe');
		});

		it('as a substitution Teacher, I am able to GET a task in my course', async () => {
			const { substitutionTeacher, homework } = await setupHomeworkWithCourse();

			const params = await testObjects.generateRequestParamsFromUser(substitutionTeacher);
			const result = await homeworkService.get(homework._id, params);
			expect(result.name).to.equal('Testaufgabe');
		});

		it('as a substitution Teacher, I am able to GET a private task in my course', async () => {
			const { substitutionTeacher, homework } = await setupHomeworkWithCourse({ asPrivate: true });

			const params = await testObjects.generateRequestParamsFromUser(substitutionTeacher);
			const result = await homeworkService.get(homework._id, params);
			expect(result.name).to.equal('Testaufgabe');
		});

		it('as a Teacher, I am not able to GET a task from a different course', async () => {
			const { homework } = await setupHomeworkWithCourse();

			const teacherTwo = await testObjects.createTestUser({ roles: ['teacher'] });

			const params = await testObjects.generateRequestParamsFromUser(teacherTwo);
			try {
				await homeworkService.get(homework._id, params);
				throw new Error('should have failed');
			} catch (err) {
				chai.expect(err.message).to.not.equal('should have failed');
				chai.expect(err.code).to.equal(403);
				chai.expect(err.message).to.equal("You don't have permissions!");
			}
		});

		it('as a student, I am able to GET a task in my course', async () => {
			const { student, homework } = await setupHomeworkWithCourse();

			const params = await testObjects.generateRequestParamsFromUser(student);
			const result = await homeworkService.get(homework._id, params);
			expect(result.name).to.equal('Testaufgabe');
		});

		it('as a student, I am not able to GET a private task in my course', async () => {
			const { student, homework } = await setupHomeworkWithCourse({ asPrivate: true });

			const params = await testObjects.generateRequestParamsFromUser(student);
			try {
				await homeworkService.get(homework._id, params);
				throw new Error('should have failed');
			} catch (err) {
				chai.expect(err.message).to.not.equal('should have failed');
				chai.expect(err.code).to.equal(403);
				chai.expect(err.message).to.equal("You don't have permissions!");
			}
		});
	});

	describe('UPDATE', () => {
		it('is blocked', async () => {
			const { teacher, course, homework } = await setupHomeworkWithCourse();
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			try {
				await homeworkService.update(
					homework._id,
					{
						teacherId: teacher._id,
						name: 'Testaufgabe',
						description: 'I changed this',
						availableDate: '2017-09-28T11:47:46.622Z',
						dueDate: '2030-11-16T12:47:00.000Z',
						private: true,
						courseId: course._id,
						schoolId: course.schoolId,
					},
					params
				);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.className).to.equal('method-not-allowed');
			}
		});
	});

	describe('PATCH', () => {
		it('teacher can PATCH his own homework', async () => {
			const { owner, homework } = await setupHomeworkWithCourse();
			const params = await testObjects.generateRequestParamsFromUser(owner);
			const result = await homeworkService.patch(homework._id, { description: 'bringe mir 12 Wolfspelze!' }, params);
			expect(result).to.not.be.undefined;
			expect(result.description).to.equal('bringe mir 12 Wolfspelze!');
		});

		it('teacher can PATCH another teachers homework in the same course', async () => {
			const { teacher, homework } = await setupHomeworkWithCourse();
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			const result = await homeworkService.patch(homework._id, { description: 'wirf den Ring ins Feuer!' }, params);
			expect(result).to.not.be.undefined;
			expect(result.description).to.equal('wirf den Ring ins Feuer!');
		});

		it('teacher can PATCH another teachers private homework in the same course', async () => {
			const { teacher, homework } = await setupHomeworkWithCourse({ asPrivate: true });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			const result = await homeworkService.patch(homework._id, { description: 'rette die Prinzessin!' }, params);
			expect(result).to.not.be.undefined;
			expect(result.description).to.equal('rette die Prinzessin!');
		});

		it('substitution teacher can PATCH another teachers homework in the same course', async () => {
			const { substitutionTeacher, homework } = await setupHomeworkWithCourse();
			const params = await testObjects.generateRequestParamsFromUser(substitutionTeacher);
			const result = await homeworkService.patch(homework._id, { description: 'zeichne mir ein Schaf!' }, params);
			expect(result).to.not.be.undefined;
			expect(result.description).to.equal('zeichne mir ein Schaf!');
		});

		it('substitution teacher can PATCH another teachers private homework in the same course', async () => {
			const { substitutionTeacher, homework } = await setupHomeworkWithCourse({ asPrivate: true });
			const params = await testObjects.generateRequestParamsFromUser(substitutionTeacher);
			const result = await homeworkService.patch(homework._id, { description: 'baue 200 Papierflieger' }, params);
			expect(result).to.not.be.undefined;
			expect(result.description).to.equal('baue 200 Papierflieger');
		});
	});
});
