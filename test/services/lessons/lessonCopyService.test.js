const { expect } = require('chai');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise);

describe('lesson copy service', () => {
	let app;
	let server;
	let lessonCopyService;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);

		lessonCopyService = app.service('lessons/copy');
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	it('can copy a lesson within a course', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const course = await testObjects.createTestCourse({ teacherIds: [teacher._id] });
		const lesson = await testObjects.createTestLesson({ courseId: course._id });

		const copy = await lessonCopyService.create({
			lessonId: lesson._id,
			newCourseId: course._id,
			userId: teacher._id,
		});
		expect(copy._id.toString()).to.not.equal(lesson._id.toString());
		expect(copy.courseId.toString()).to.equal(course._id.toString());
		expect(copy.description).to.eq(lesson.description);
	});

	it('can copy a lesson with a homework', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const course = await testObjects.createTestCourse({ teacherIds: [teacher._id] });
		const lesson = await testObjects.createTestLesson({ courseId: course._id });
		const homework = await testObjects.createTestHomework({
			teacherId: teacher._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			lessonId: lesson._id,
		});

		const copy = await lessonCopyService.create({
			lessonId: lesson._id,
			newCourseId: course._id,
			userId: teacher._id,
		});
		expect(copy._id.toString()).to.not.equal(lesson._id.toString());
		expect(copy.courseId.toString()).to.equal(course._id.toString());
		expect(copy.description).to.eq(lesson.description);
		const homeworkCopies = await app.service('homework').find({ query: { lessonId: copy._id } });
		expect(homeworkCopies.total).to.equal(1);
		expect(homeworkCopies.data[0]._id.toString()).to.not.equal(homework._id.toString());
	});

	it('can copy a lesson for a different user', async () => {
		const originalTeacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const targetTeacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const originalCourse = await testObjects.createTestCourse({ teacherIds: [originalTeacher._id] });
		const targetCourse = await testObjects.createTestCourse({ teacherIds: [originalTeacher._id] });
		const shareToken = `sharetoken${Date.now()}`;
		const lesson = await testObjects.createTestLesson({ courseId: originalCourse._id, shareToken });

		const copy = await lessonCopyService.create({
			lessonId: lesson._id,
			newCourseId: targetCourse._id,
			userId: targetTeacher._id,
			shareToken,
		});
		expect(copy._id.toString()).to.not.equal(lesson._id.toString());
		expect(copy.courseId.toString()).to.equal(targetCourse._id.toString());
		expect(copy.description).to.eq(lesson.description);
	});

	it('can copy a lesson for a different school', async () => {
		const originalSchool = await testObjects.createTestSchool();
		const targetSchool = await testObjects.createTestSchool();
		const originalTeacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: originalSchool._id });
		const targetTeacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: targetSchool._id });
		const originalCourse = await testObjects.createTestCourse({
			teacherIds: [originalTeacher._id],
			schoolId: originalSchool._id,
		});
		const targetCourse = await testObjects.createTestCourse({
			teacherIds: [originalTeacher._id],
			schoolId: targetSchool._id,
		});
		const shareToken = `sharetoken${Date.now()}`;
		const lesson = await testObjects.createTestLesson({ courseId: originalCourse._id, shareToken });

		const copy = await lessonCopyService.create({
			lessonId: lesson._id,
			newCourseId: targetCourse._id,
			userId: targetTeacher._id,
			shareToken,
		});
		expect(copy._id.toString()).to.not.equal(lesson._id.toString());
		expect(copy.courseId.toString()).to.equal(targetCourse._id.toString());
		expect(copy.description).to.eq(lesson.description);
	});
});
