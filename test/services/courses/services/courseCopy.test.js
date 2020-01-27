const assert = require('assert');
const chai = require('chai');

const app = require('../../../../src/app');

const copyCourseService = app.service('courses/copy');
const shareCourseService = app.service('courses/share');

const testObjects = require('../../helpers/testObjects')(app);

const testUserId = '0000d231816abba584714c9e';
const testCourseExample = '0000dcfbfb5c7a3f00bf21ab';

let shareToken;

describe('courses copy service', () => {
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
		// todo: refactor to use testObjects
		const newCourseName = 'testCourse 76';
		const courseCopy = await copyCourseService.create({
			_id: testCourseExample, name: newCourseName, userId: testUserId,
		});

		chai.expect(courseCopy.name).to.equal(newCourseName);
		chai.expect(courseCopy.userIds).to.have.lengthOf(0);
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

	it('creates a course copy through shareToken', () => shareCourseService.create({
		shareToken,
		courseName: 'testCourse 76',
		userId: testUserId,
	}).then((course) => {
		chai.expect(course.name).to.equal('testCourse 76');
	}));
});
