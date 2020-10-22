const assert = require('assert');
const { expect } = require('chai');
const appPromise = require('../../../src/app');

const testObjects = require('../helpers/testObjects')(appPromise);

const testLesson = {
	name: 'testLesson',
	description: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr',
	courseId: '0000dcfbfb5c7a3f00bf21ab',
	userId: '0000d231816abba584714c9e',
};

describe('lessons service', () => {
	let app;
	let lessonService;
	let lessonCopyService;
	let server;

	before(async () => {
		app = await appPromise;
		lessonService = app.service('lessons');
		lessonCopyService = app.service('lessons/copy');
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	it('registered the lessons service', () => {
		assert.ok(lessonService);
		assert.ok(lessonCopyService);
	});

	it('creates a lesson', () =>
		lessonService.create(testLesson).then((lesson) => {
			expect(lesson.name).to.equal(testLesson.name);
			expect(lesson.description).to.equal(testLesson.description);
			expect(lesson.courseId.toString()).to.equal(testLesson.courseId);
		}));

	it('GET a lesson', async () => {
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

	describe('student operations', () => {
		it('student can CREATE courseGroup lesson', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const { _id: courseId } = await testObjects.createTestCourse({
				schoolId,
				teacherIds: [teacher._id],
				userIds: [student._id],
			});
			const { _id: courseGroupId } = await testObjects.createTestCourseGroup({
				userIds: [student._id],
				schoolId,
				courseId,
			});
			const params = await testObjects.generateRequestParamsFromUser(student);
			const data = { name: 'students always use cool names', courseGroupId };
			const result = await app.service('lessons').create(data, params);
			expect(result).to.haveOwnProperty('_id');
			expect(result.name).to.equal('students always use cool names');
		});

		it('student can REMOVE courseGroup lesson', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const { _id: courseId } = await testObjects.createTestCourse({
				schoolId,
				teacherIds: [teacher._id],
				userIds: [student._id],
			});
			const { _id: courseGroupId } = await testObjects.createTestCourseGroup({
				userIds: [student._id],
				schoolId,
				courseId,
			});
			const { _id: lessonId } = await testObjects.createTestLesson({ name: 'testlesson', courseGroupId });
			const params = await testObjects.generateRequestParamsFromUser(student);
			const result = await app.service('lessons').remove(lessonId, params);
			expect(result).to.haveOwnProperty('_id');
		});

		it('student can PATCH courseGroup lesson', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const { _id: courseId } = await testObjects.createTestCourse({
				schoolId,
				teacherIds: [teacher._id],
				userIds: [student._id],
			});
			const { _id: courseGroupId } = await testObjects.createTestCourseGroup({
				userIds: [student._id],
				schoolId,
				courseId,
			});
			const { _id: lessonId } = await testObjects.createTestLesson({ name: 'testlesson', courseGroupId });
			const params = await testObjects.generateRequestParamsFromUser(student);
			const data = { name: 'students always use cool names', courseId, courseGroupId };
			const result = await app.service('lessons').patch(lessonId, data, params);
			expect(result).to.haveOwnProperty('_id');
			expect(result.name).to.equal('students always use cool names');
		});

		it('the teacher can create courseGroup lessons', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const { _id: courseId } = await testObjects.createTestCourse({
				schoolId,
				teacherIds: [teacher._id],
				userIds: [student._id],
			});
			// create a second course to be sure the course selection works
			await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
			const { _id: courseGroupId } = await testObjects.createTestCourseGroup({
				userIds: [student._id],
				schoolId,
				courseId,
			});
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			const data = { name: 'Here we go...', courseGroupId };
			const result = await app.service('lessons').create(data, params);
			expect(result).to.haveOwnProperty('_id');
			expect(result.name).to.equal('Here we go...');
		});
	});

	describe('security features', () => {
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
				expect(err.code).to.equal(404);
				expect(err.message).to.equal(`no record found for id '${lesson._id}'`);
			}
		});

		it('Admin can not GET a lesson from a foreign school', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const { _id: otherschoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const foreignteacher = await testObjects.createTestUser({ roles: ['administrator'], schoolId: otherschoolId });
			const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
			const lesson = await testObjects.createTestLesson({ name: 'testlesson', courseId: course._id });
			const params = await testObjects.generateRequestParamsFromUser(foreignteacher);
			params.query = {};

			try {
				await app.service('lessons').get(lesson._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(404);
				expect(err.message).to.equal(`no record found for id '${lesson._id}'`);
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
				expect(err.code).to.equal(404);
				expect(err.message).to.equal(`no record found for id '${lesson._id}'`);
			}
		});

		it('Admin can not FIND all lessons', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
			const params = await testObjects.generateRequestParamsFromUser(admin);
			params.query = {};

			try {
				await app.service('lessons').find(params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(400);
				expect(err.message).to.equal('this operation requires courseId, courseGroupId, or shareToken');
			}
		});

		it('Admin can not FIND foreign lessons', async () => {
			const { _id: otherschoolId } = await testObjects.createTestSchool({});
			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: otherschoolId });
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
			await testObjects.createTestLesson({ name: 'testlesson', courseId: course._id });
			const params = await testObjects.generateRequestParamsFromUser(admin);
			params.query = { courseId: course._id };

			try {
				await app.service('lessons').find(params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(404);
				expect(err.message).to.equal(`no record found for id '${course._id}'`);
			}
		});

		it('Student can not GET a lesson from a coursegroup the user is not in', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const otherStudent = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const { _id: courseId } = await testObjects.createTestCourse({
				schoolId,
				teacherIds: [teacher._id],
				userIds: [student._id, otherStudent._id],
			});
			const { _id: courseGroupId } = await testObjects.createTestCourseGroup({
				userIds: [student._id],
				schoolId,
				courseId,
			});
			const lesson = await testObjects.createTestLesson({ name: 'testlesson', courseId, courseGroupId });
			const params = await testObjects.generateRequestParamsFromUser(otherStudent);
			params.query = {};

			try {
				await app.service('lessons').get(lesson._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(404);
				expect(err.message).to.equal(`no record found for id '${lesson._id}'`);
			}
		});

		it('Teacher can not create lesson on foreign school', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const { _id: otherschoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const otherTeacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: otherschoolId });
			const course = await testObjects.createTestCourse({ otherschoolId, teacherIds: [otherTeacher._id] });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			const data = {
				name: 'about intrusions',
				courseId: course._id,
			};
			try {
				await app.service('lessons').create(data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal("The entered course doesn't belong to you!");
			}
		});

		it('Teacher can PATCH his own lessons', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
			const lesson = await testObjects.createTestLesson({ name: 'testlesson', courseId: course._id });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			const data = {
				name: 'this name is better',
			};
			const result = await app.service('lessons').patch(lesson._id, data, params);
			expect(result._id.toString()).to.equal(lesson._id.toString());
			expect(result.name).to.equal('this name is better');
		});

		it('Teacher can not PATCH lesson on foreign school', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const { _id: otherschoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const otherTeacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: otherschoolId });
			const course = await testObjects.createTestCourse({ otherschoolId, teacherIds: [otherTeacher._id] });
			const lesson = await testObjects.createTestLesson({ name: 'testlesson', courseId: course._id });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			const data = {
				name: 'hostile takeover',
			};
			try {
				await app.service('lessons').patch(lesson._id, data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(404);
				expect(err.message).to.equal(`no record found for id '${lesson._id}'`);
			}
		});

		it('Teacher can not UPDATE lesson on foreign school', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const { _id: otherschoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const otherTeacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: otherschoolId });
			const course = await testObjects.createTestCourse({ otherschoolId, teacherIds: [otherTeacher._id] });
			const targetCourse = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
			const lesson = await testObjects.createTestLesson({ name: 'testlesson', courseId: course._id });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			const data = {
				name: 'hostile takeover',
				courseId: targetCourse._id,
			};
			try {
				await app.service('lessons').update(lesson._id, data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(404);
				expect(err.message).to.equal(`no record found for id '${lesson._id}'`);
			}
		});

		it('Teacher can not REMOVE lesson on foreign school', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const { _id: otherschoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const otherTeacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: otherschoolId });
			const course = await testObjects.createTestCourse({ otherschoolId, teacherIds: [otherTeacher._id] });
			const lesson = await testObjects.createTestLesson({ name: 'testlesson', courseId: course._id });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			try {
				await app.service('lessons').remove(lesson._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(404);
				expect(err.message).to.equal(`no record found for id '${lesson._id}'`);
			}
		});

		it('can not populate courseId', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const otherStudent = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const { _id: courseId } = await testObjects.createTestCourse({
				schoolId,
				teacherIds: [teacher._id],
				userIds: [student._id, otherStudent._id],
			});
			const { _id: courseGroupId } = await testObjects.createTestCourseGroup({
				userIds: [student._id],
				schoolId,
				courseId,
			});
			const lesson = await testObjects.createTestLesson({ name: 'testlesson', courseId, courseGroupId });
			const params = await testObjects.generateRequestParamsFromUser(otherStudent);
			params.query = { $populate: ['courseId'] };

			try {
				await app.service('lessons').get(lesson._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should not have failed');
				expect(err.code).to.equal(400);
				expect(err.message).to.equal('populate not supported');
			}
		});

		it('can populate materials', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const { _id: courseId } = await testObjects.createTestCourse({
				schoolId,
				teacherIds: [teacher._id],
			});
			const lesson = await testObjects.createTestLesson({ name: 'testlesson', courseId });
			await app.service('/lessons/:lessonId/material').create(
				{
					title: 'testTitle',
					client: 'someclient',
					url: 'hpi.schul-cloud.org',
				},
				{ route: { lessonId: lesson._id } }
			);
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = { $populate: ['materialIds'] };
			const result = await app.service('lessons').get(lesson._id, params);

			expect(result.materialIds.length).to.equal(1);
			expect(typeof result.materialIds[0]).to.equal('object');
			expect(result.materialIds[0]).to.haveOwnProperty('_id');
			expect(result.materialIds[0]).to.haveOwnProperty('title');
			expect(result.materialIds[0]).to.haveOwnProperty('client');
			expect(result.materialIds[0]).to.haveOwnProperty('url');
		});
	});
});
