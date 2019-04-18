const assert = require('assert');

const chai = require('chai');
const app = require('../../../src/app');

const lessonService = app.service('lessons');
const lessonCopyService = app.service('lessons/copy');

const testLesson = {
	name: 'testLesson',
	description: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr',
	courseId: '0000dcfbfb5c7a3f00bf21ab',
	userId: '0000d231816abba584714c9e',
};

let lessonId;

describe('lessons service', () => {
	it('registered the lessons service', () => {
		assert.ok(lessonService);
		assert.ok(lessonCopyService);
	});

	it('creates a lesson', () => lessonService.create(testLesson)
		.then((lesson) => {
			lessonId = lesson._id;
			chai.expect(lesson.name).to.equal(testLesson.name);
			chai.expect(lesson.description).to.equal(testLesson.description);
			chai.expect(lesson.courseId.toString()).to.equal(testLesson.courseId);
		}));

	it('copies a lesson', () => lessonCopyService.create({ lessonId, newCourseId: testLesson.courseId, userId: '0000d231816abba584714c9e' })
		.then((lesson) => {
			chai.expect(lesson.name).to.equal(testLesson.name);
			chai.expect(lesson.description).to.equal(testLesson.description);
			chai.expect(lesson.courseId.toString()).to.equal(testLesson.courseId);
			chai.expect(lesson._id.toString()).to.not.equal(lessonId);
		}));
});
