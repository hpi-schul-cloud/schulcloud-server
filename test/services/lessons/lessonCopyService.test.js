const { expect } = require('chai');
const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);

const lessonCopyService = app.service('lessons/copy');

describe('lesson copy service', () => {
	after(async () => {
		testObjects.cleanup();
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
		const homeworkCopies = await app.service('homework').find({ query: { lessonId: copy._id } });
		expect(homeworkCopies.total).to.equal(1);
		expect(homeworkCopies.data[0]._id.toString()).to.not.equal(homework._id.toString());
	});
});
