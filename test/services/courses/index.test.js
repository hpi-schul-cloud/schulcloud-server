const chai = require('chai');

const app = require('../../../src/app');

const courseGroupService = app.service('courseGroups');
const lessonsService = app.service('lessons');

const testObjects = require('../helpers/testObjects')(app);

const testUserId = '0000d231816abba584714c9e';
const testCourseExample = '0000dcfbfb5c7a3f00bf21ab';

const testCourse = {
	name: 'testCourse',
	schoolId: '0000d186816abba584714c5f',
	userIds: [],
	classIds: [],
	teacherIds: [],
	ltiToolIds: [],
};

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

describe('courseGroup service', () => {
	it('creates a courseGroup in a course', async () => {
		const course = await testObjects.createTestCourse({});
		testCourseGroup.courseId = course._id;
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
