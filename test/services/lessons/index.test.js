const assert = require('assert');
const { expect } = require('chai');
const app = require('../../../src/app');

const lessonService = app.service('lessons');
const lessonCopyService = app.service('lessons/copy');
const testObjects = require('../helpers/testObjects')(app);

const testLesson = {
	name: 'testLesson',
	description: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr',
	courseId: '0000dcfbfb5c7a3f00bf21ab',
	userId: '0000d231816abba584714c9e',
};

describe('lessons service', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	it('registered the lessons service', () => {
		assert.ok(lessonService);
		assert.ok(lessonCopyService);
	});

	it('creates a lesson', () => lessonService.create(testLesson)
		.then((lesson) => {
			expect(lesson.name).to.equal(testLesson.name);
			expect(lesson.description).to.equal(testLesson.description);
			expect(lesson.courseId.toString()).to.equal(testLesson.courseId);
		}));

	it('GET a course', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
		const lesson = await testObjects.createTestLesson({ name: 'testlesson', courseId: course._id });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = {};
		const result = await app.service('lessons').get(lesson._id, params);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('_id');
		expect(result).to.haveOwnProperty('name');
	});

	it('Teacher can not GET a lesson from a foreign school', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const { _id: otherschoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const foreignteacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: otherschoolId });
		const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
		const lesson = await testObjects.createTestLesson({ name: 'testlesson', courseId: course._id });
		const params = await testObjects.generateRequestParamsFromUser(foreignteacher);
		params.query = {};

		try {
			await app.service('lessons').get(lesson._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have access to that lesson.");
		}
	});

	it('Teacher can not GET a lesson from a different course', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const otherteacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
		const lesson = await testObjects.createTestLesson({ name: 'testlesson', courseId: course._id });
		const params = await testObjects.generateRequestParamsFromUser(otherteacher);
		params.query = {};

		try {
			await app.service('lessons').get(lesson._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have access to that lesson.");
		}
	});

	it('Student can not GET a lesson from a coursegroup the user is not in', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const otherStudent = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const { _id: courseId } = await testObjects.createTestCourse({
			schoolId, teacherIds: [teacher._id], userIds: [student._id, otherStudent._id],
		});
		const { _id: courseGroupId } = await testObjects.createTestCourseGroup({
			userIds: [student._id], schoolId, courseId,
		});
		const lesson = await testObjects.createTestLesson({ name: 'testlesson', courseId, courseGroupId });
		const params = await testObjects.generateRequestParamsFromUser(otherStudent);
		params.query = {};

		try {
			await app.service('lessons').get(lesson._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have access to that lesson.");
		}
	});

	it('can not populate other than materialIds');
});
