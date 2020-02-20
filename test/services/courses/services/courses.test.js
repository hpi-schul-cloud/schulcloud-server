const { expect } = require('chai');

const app = require('../../../../src/app');

const courseService = app.service('courses');

const testObjects = require('../../helpers/testObjects')(app);

describe('course service', () => {
	it('registered the courses service', () => {
		expect(courseService).to.not.be.undefined;
	});

	it('creates a course', async () => {
		const course = await courseService.create({
			name: 'testCourse',
			schoolId: '0000d186816abba584714c5f',
			userIds: [],
			classIds: [],
			teacherIds: [],
			ltiToolIds: [],
		});
		expect(course.name).to.equal('testCourse');
		expect(course.userIds).to.have.lengthOf(0);
	});

	it('teacher can PATCH course', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const course = await testObjects.createTestCourse({ name: 'courseNotChanged', teacherIds: [teacher._id] });
		const params = await testObjects.generateRequestParamsFromUser(teacher);

		const result = await courseService.patch(course._id, { name: 'courseChanged' }, params);
		expect(result.name).to.equal('courseChanged');
	});

	it('substitution teacher can not PATCH course', async () => {
		try {
			const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
			const course = await testObjects.createTestCourse({
				name: 'courseNotChanged', substitutionIds: [teacher._id],
			});
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			await courseService.patch(course._id, { name: 'courseChanged' }, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.eq(403);
		}
	});

	it('teacher can DELETE course', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const course = await testObjects.createTestCourse({ name: 'course', teacherIds: [teacher._id] });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = {};

		const result = await courseService.remove(course._id, params);
		expect(result).to.not.be.undefined;
	});

	it('substitution teacher can not DELETE course', async () => {
		try {
			const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
			const course = await testObjects.createTestCourse({
				substitutionIds: [teacher._id],
			});
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = {};
			await courseService.remove(course._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.eq(403);
		}
	});
});
