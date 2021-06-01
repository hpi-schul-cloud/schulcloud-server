const { expect } = require('chai');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise);

describe('addMaterial Service', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	it('creates a material', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
		const lesson = await testObjects.createTestLesson({ name: 'testlesson', courseId: course._id });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = {};
		params.route = { lessonId: lesson._id };
		const result = await app.service('/lessons/:lessonId/material').create(
			{
				title: 'testTitle',
				client: 'someclient',
				url: 'hpi.schul-cloud.org',
			},
			params
		);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('_id');
		expect(result).to.haveOwnProperty('title');
		expect(result).to.haveOwnProperty('client');
		expect(result).to.haveOwnProperty('url');
	});

	it('adds the material to the lesson in course', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
		const lesson = await testObjects.createTestLesson({ name: 'testlesson', courseId: course._id });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = {};
		params.route = { lessonId: lesson._id };
		const { _id: materialId } = await app.service('/lessons/:lessonId/material').create(
			{
				title: 'testTitle',
				client: 'someclient',
				url: 'hpi.schul-cloud.org',
			},
			params
		);
		const result = await app.service('lessons').get(lesson._id);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('materialIds');
		expect(result.materialIds[0].toString()).to.equal(materialId.toString());
	});

	it('adds bulk materials to the lesson in course', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
		const lesson = await testObjects.createTestLesson({ name: 'testlesson', courseId: course._id });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = {};
		params.route = { lessonId: lesson._id };

		const response = await app.service('/lessons/:lessonId/material').create(
			[
				{
					title: 'testTitle1',
					client: 'someclient',
					url: 'hpi.schul-cloud.org',
				},
				{
					title: 'testTitle2',
					client: 'someclient',
					url: 'hpi.schul-cloud.org',
				},
			],
			params
		);
		const responseIds = response.map((id) => id._id.toString());
		const result = await app.service('lessons').get(lesson._id);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('materialIds');
		const resultMaterialIds = result.materialIds.map((id) => id.toString());
		expect(resultMaterialIds).to.be.an('array').of.length(2);
		expect(responseIds).to.have.members(resultMaterialIds);
	});

	it('adds the material to the lesson in courseGroup', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
		const courseGroup = await testObjects.createTestCourseGroup({ courseId: course._id });
		const lesson = await testObjects.createTestLesson({ name: 'testlesson', courseGroupId: courseGroup._id });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = {};
		params.route = { lessonId: lesson._id };
		const { _id: materialId } = await app.service('/lessons/:lessonId/material').create(
			{
				title: 'testTitle',
				client: 'someclient',
				url: 'hpi.schul-cloud.org',
			},
			params
		);
		const result = await app.service('lessons').get(lesson._id);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('materialIds');
		expect(result.materialIds[0].toString()).to.equal(materialId.toString());
	});

	it('cant add materials to lessons of a course the user is not in', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const otherTeacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
		const lesson = await testObjects.createTestLesson({ name: 'testlesson', courseId: course._id });
		const params = await testObjects.generateRequestParamsFromUser(otherTeacher);
		params.query = {};
		params.route = { lessonId: lesson._id };

		try {
			await app.service('/lessons/:lessonId/material').create(
				{
					title: 'testTitle',
					client: 'someclient',
					url: 'hpi.schul-cloud.org',
				},
				params
			);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(404);
			expect(err.message).to.equal(`no record found for id '${lesson._id}'`);
		}
	});
});
