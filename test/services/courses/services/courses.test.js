const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons/lib');

const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise());
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');

describe('course service', () => {
	let app;
	let courseService;
	let nestServices;
	let server;
	let nestGroupService;

	before(async () => {
		app = await appPromise();
		nestServices = await setupNestServices(app);
		courseService = app.service('courses');
		nestGroupService = app.service('nest-group-service');
	});

	after(async () => {
		await server.close();
		await closeNestServices(nestServices);
	});

	it('registered the courses service', () => {
		expect(courseService).to.not.be.undefined;
	});

	it('creates a course', async () => {
		const course = await courseService.create({
			name: 'testCourse',
			schoolId: '5f2987e020834114b8efd6f8',
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
				name: 'courseNotChanged',
				substitutionIds: [teacher._id],
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

	describe('Patch Course', () => {
		describe('when FEATURE_GROUPS_IN_COURSE_ENABLED is enabled', async () => {
			const setup = async () => {
				Configuration.set('FEATURE_GROUPS_IN_COURSE_ENABLED', true);
				const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
				const student = await testObjects.createTestUser({ roles: ['student'] });
				const class1 = await testObjects.createTestClass({ teacherIds: [teacher._id] });
				const group1 = await testObjects.createTestCourseGroup({ teacherIds: [teacher._id], userIds: [student._id] });

				const course = await testObjects.createTestCourse({
					name: 'courseNotChanged',
					teacherIds: [teacher._id],
					classIds: [class1._id],
					groupIds: [group1._id],
				});
				const params = await testObjects.generateRequestParamsFromUser(teacher);

				return { teacher, course, params };
			};

			it('should add whole classmembers and groupmembers to course', async () => {
				const { course, params } = await setup();
				const result = await courseService.patch(course._id, { name: 'courseChanged' }, params);
				expect(result.name).to.equal('courseChanged');
				expect(result.userIds).to.have.lengthOf(1);
			});
		});
	});
});
