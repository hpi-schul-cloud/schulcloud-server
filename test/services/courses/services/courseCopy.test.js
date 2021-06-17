const assert = require('assert');
const chai = require('chai');

const appPromise = require('../../../../src/app');

const testObjects = require('../../helpers/testObjects')(appPromise);

const testUserId = '0000d231816abba584714c9e';
const testCourseExample = '0000dcfbfb5c7a3f00bf21ab';

let shareToken;

describe('courses copy service', () => {
	let app;
	let copyCourseService;
	let shareCourseService;
	let server;

	before(async () => {
		app = await appPromise;
		copyCourseService = app.service('courses/copy');
		shareCourseService = app.service('courses-share');
		server = await app.listen();
	});

	after(async () => {
		await server.close();
	});

	it('registered the course copy service', () => {
		assert.ok(copyCourseService);
	});

	it('creates a course copy', async () => {
		const course = await testObjects.createTestCourse({});
		const newCourseName = 'testCourse 76';
		const courseCopy = await copyCourseService.create({ _id: course._id, name: newCourseName });

		chai.expect(courseCopy.name).to.equal(newCourseName);
		chai.expect(courseCopy.schoolId.toString()).to.equal(course.schoolId.toString());
		chai.expect(courseCopy.userIds).to.have.lengthOf(0);
	});

	it('creates a course copy including homeworks', async () => {
		const ONEDAYINMILLISECONDS = 1000 * 60 * 60 * 24;

		const teacher = await testObjects.createTestUser();
		const course = await testObjects.createTestCourse({ teacherIds: teacher._id });
		await app.service('homework').create({
			schoolId: course.schoolId,
			teacherId: teacher._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: Date.now() + ONEDAYINMILLISECONDS,
			private: true,
			courseId: course._id,
		});

		const courseCopy = await copyCourseService.create({
			_id: testCourseExample,
			name: 'course copy',
			userId: teacher._id,
		});

		chai.expect(courseCopy.name).to.equal('course copy');
		chai.expect(courseCopy.userIds).to.have.lengthOf(0);

		const homeworkCopies = await app.service('homework').find({
			query: { courseId: course._id },
			account: { userId: teacher._id },
		});
		chai.expect(homeworkCopies.total).to.equal(1);
	});

	it('creates a shareToken for a course', async () => {
		const course = await testObjects.createTestCourse({});
		const sharedCourse = await shareCourseService.get(course._id);
		chai.expect(sharedCourse.shareToken).to.not.be.undefined;
	});

	it('find name of course through shareToken', async () => {
		const course = await testObjects.createTestCourse({ name: 'Deutsch 10a' });
		const sharedCourse = await shareCourseService.get(course._id);
		const courseName = await shareCourseService.find({ query: { shareToken: sharedCourse.shareToken } });
		chai.expect(courseName).to.equal('Deutsch 10a');
	});

	it('creates a course copy through shareToken', async () => {
		const course = await shareCourseService.create({
			shareToken,
			courseName: 'testCourse 76',
			userId: testUserId,
		});
		chai.expect(course.name).to.equal('testCourse 76');
	});

	it('teacher can share a course', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		const course = await testObjects.createTestCourse({ teacherIds: [teacher._id] });
		const sharedCourse = await shareCourseService.get(course._id, params);
		chai.expect(sharedCourse.shareToken).to.not.be.undefined;
	});
});
