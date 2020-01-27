const assert = require('assert');
const chai = require('chai');

const app = require('../../../../src/app');

const courseService = app.service('courses');

// const testObjects = require('../helpers/testObjects')(app);

describe('course service', () => {
	it('registered the courses service', () => {
		assert.ok(courseService);
	});

	it('creates a course', () => courseService.create({
		name: 'testCourse',
		schoolId: '0000d186816abba584714c5f',
		userIds: [],
		classIds: [],
		teacherIds: [],
		ltiToolIds: [],
	})
		.then((course) => {
			chai.expect(course.name).to.equal('testCourse');
			chai.expect(course.userIds).to.have.lengthOf(0);
		}));
});
