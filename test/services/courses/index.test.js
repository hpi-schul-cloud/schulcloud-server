

const assert = require('assert');
const app = require('../../../src/app');

const courseService = app.service('courses');
const copyCourseService = app.service('courses/copy');
const shareCourseService = app.service('courses/share');
const courseGroupService = app.service('courseGroups');
const lessonsService = app.service('lessons');
const chai = require('chai');

const { expect } = chai;

const testUserId = '0000d231816abba584714c9e';
const testCourseExample = '0000dcfbfb5c7a3f00bf21ab';

const testCourse = {
	name: 'testCourse',
	schoolId: '584ad186816abba584714c94',
	userIds: [],
	classIds: [],
	teacherIds: [],
	ltiToolIds: [],
};

let courseId;
let shareToken;
let courseGroupId;
let lessonId;

const testCourseGroup = {
	name: 'testCourseGroup',
	schoolId: testCourse.schoolId,
};

const testLesson = {
	name: 'testLesson',
	position: '',
	content: [],
	userId: testUserId,
};

describe('courses service', () => {
	it('registered the courses service', () => {
		assert.ok(courseService);
		assert.ok(copyCourseService);
	});

	it('creates a course', () => courseService.create(testCourse)
		.then((course) => {
			courseId = course._id;
			chai.expect(course.name).to.equal(testCourse.name);
			chai.expect(course.userIds).to.have.lengthOf(0);
		}));

	it('creates a course copy', () => {
		const newCourseName = 'testCourse 76';
		return copyCourseService.create({ _id: courseId, name: newCourseName })
			.then((course) => {
				chai.expect(course.name).to.equal(newCourseName);
				chai.expect(course.schoolId.toString()).to.equal(testCourse.schoolId);
				chai.expect(course.userIds).to.have.lengthOf(0);
			});
	});

	it('creates a course copy including homeworks', () => {
		const newCourseName = 'testCourse 76';
		return copyCourseService.create({ _id: testCourseExample, name: newCourseName, userId: testUserId })
			.then((course) => {
				chai.expect(course.name).to.equal(newCourseName);
				chai.expect(course.userIds).to.have.lengthOf(0);
			});
	});

	it('creates a shareToken for a course', () => shareCourseService.get('0000dcfbfb5c7a3f00bf21ab')
		.then((course) => {
			shareToken = course.shareToken;
			chai.expect(course.shareToken).to.not.be.undefined;
		}));

	it('find name of course through shareToken', () => shareCourseService.find({ query: { shareToken } })
		.then((courseName) => {
			chai.expect(courseName).to.equal('Mathe');
		}));

	it('creates a course copy through shareToken', () => shareCourseService.create({ shareToken, courseName: 'testCourse 76', userId: testUserId })
		.then((course) => {
			chai.expect(course.name).to.equal('testCourse 76');
		}));

	it('creates a courseGroup in a course', () => {
		testCourseGroup.courseId = courseId;
		return courseGroupService.create(testCourseGroup)
			.then((courseGroup) => {
				courseGroupId = courseGroup._id;
				chai.expect(courseGroup.name).to.equal('testCourseGroup');
			});
	});

	it('patches a courseGroup', () => courseGroupService.patch(courseGroupId, {
		name: 'new testCourseGroup',
	})
		.then((courseGroup) => {
			chai.expect(courseGroup.name).to.equal('new testCourseGroup');
		}));

	it('create a lesson inside a courseGroup', () => {
		testLesson.courseGroupId = courseGroupId;
		testLesson.courseId = testCourseExample;
		return lessonsService.create(testLesson)
			.then((lesson) => {
				lessonId = lesson._id;
				chai.expect(lesson.name).to.equal('testLesson');
			});
	});

	it('removes a lesson of a courseGroup', () => lessonsService.remove(lessonId)
		.then((lesson) => {
			chai.expect(lesson._id.toString()).to.equal(lessonId.toString());
		}));

	it('removes a courseGroup', () => courseGroupService.remove(courseGroupId)
		.then((courseGroup) => {
			chai.expect(courseGroup.name).to.equal('new testCourseGroup');
			chai.expect(courseGroup._id.toString()).to.equal(courseGroupId.toString());
		}));
});
