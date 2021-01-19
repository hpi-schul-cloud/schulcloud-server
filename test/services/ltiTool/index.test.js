const { expect } = require('chai');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise);
const { generateRequestParamsFromUser } = require('../helpers/services/login')(appPromise);


describe('ltiTool service', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await ltiToolService.remove(testTool);
		await server.close();
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	it('registered the ltiTools service', () => {
		expect(app.service('ltiTools')).to.be.ok;
	});

	it('students can not patch the tools in their own courses', async () => {
		try {
			const student = await testObjects.createTestUser({ roles: 'student' });
			const tool = await testObjects.createTestLtiTool();
			await testObjects.createTestCourse({ userIds: [student._id], ltiToolIds: [tool._id] });

			const params = await generateRequestParamsFromUser(student);
			await app.service('ltiTools').patch(tool._id, { name: 'toolChanged' }, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.eq(403);
		}
	});

	it('teachers can patch the tools in their own courses', async () => {
		const teacher = await testObjects.createTestUser({ roles: 'teacher' });
		const tool = await testObjects.createTestLtiTool();
		await testObjects.createTestCourse({ teacherIds: [teacher._id], ltiToolIds: [tool._id] });

		const params = await generateRequestParamsFromUser(teacher);
		const result = await app.service('ltiTools').patch(tool._id, { name: 'toolChanged' }, params);
		expect(result.name).to.equal('toolChanged');
	});

	it('substitute teachers can patch the tools in their own courses', async () => {
		const substitutionTeacher = await testObjects.createTestUser({ roles: 'teacher' });
		const tool = await testObjects.createTestLtiTool();
		await testObjects.createTestCourse({ substitutionIds: [substitutionTeacher._id], ltiToolIds: [tool._id] });

		const params = await generateRequestParamsFromUser(substitutionTeacher);
		const result = await app.service('ltiTools').patch(tool._id, { name: 'toolChanged' }, params);
		expect(result.name).to.equal('toolChanged');
	});

	it('teachers can not patch the tools in foreign courses', async () => {
		try {
			const courseTeacher = await testObjects.createTestUser({ roles: 'teacher' });
			const otherTeacher = await testObjects.createTestUser({ roles: 'teacher' });
			const tool = await testObjects.createTestLtiTool();
			await testObjects.createTestCourse({ teacherIds: [courseTeacher._id], ltiToolIds: [tool._id] });

			const params = await generateRequestParamsFromUser(otherTeacher);
			await app.service('ltiTools').patch(tool._id, { name: 'toolChanged' }, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.eq(403);
		}
	});

	it('patch does not return the secret', async () => {
		const teacher = await testObjects.createTestUser({ roles: 'teacher' });
		const tool = await testObjects.createTestLtiTool();
		await testObjects.createTestCourse({ teacherIds: [teacher._id], ltiToolIds: [tool._id] });

		const params = await generateRequestParamsFromUser(teacher);
		const result = await app.service('ltiTools').patch(tool._id, { name: 'toolChanged' }, params);
		expect(result.secret).to.be.undefined;
	});

	it('students can not delete the tools in their own courses', async () => {
		try {
			const student = await testObjects.createTestUser({ roles: 'student' });
			const tool = await testObjects.createTestLtiTool();
			await testObjects.createTestCourse({ userIds: [student._id], ltiToolIds: [tool._id] });

			const params = await generateRequestParamsFromUser(student);
			await app.service('ltiTools').remove(tool._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.eq(403);
		}
	});

	it('teachers can delete the tools in their own courses', async () => {
		const teacher = await testObjects.createTestUser({ roles: 'teacher' });
		const tool = await testObjects.createTestLtiTool();
		await testObjects.createTestCourse({ teacherIds: [teacher._id], ltiToolIds: [tool._id] });

		const params = await generateRequestParamsFromUser(teacher);
		const result = await app.service('ltiTools').remove(tool._id, params);
		expect(result).to.not.be.undefined;
	});

	it('teachers can not delete the tools in foreign courses', async () => {
		try {
			const courseTeacher = await testObjects.createTestUser({ roles: 'teacher' });
			const otherTeacher = await testObjects.createTestUser({ roles: 'teacher' });
			const tool = await testObjects.createTestLtiTool();
			await testObjects.createTestCourse({ teacherIds: [courseTeacher._id], ltiToolIds: [tool._id] });

			const params = await generateRequestParamsFromUser(otherTeacher);
			await app.service('ltiTools').remove(tool._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.eq(403);
		}
	});
});
