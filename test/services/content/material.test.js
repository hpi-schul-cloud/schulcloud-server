const assert = require('assert');
const { expect } = require('chai');
const { Forbidden } = require('../../../src/errors');
const appPromise = require('../../../src/app');
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');
const Material = require('../../../src/services/content/material-model');
const testHelper = require('../helpers/testObjects');

describe('material service', () => {
	let app;
	let server;
	let nestServices;
	let testObjects;

	before(async () => {
		app = await appPromise();
		nestServices = await setupNestServices(app);
		server = await app.listen(0);
		testObjects = testHelper(app);
	});

	after(async () => {
		await server.close();
		await closeNestServices(nestServices);
	});

	describe('Access control', () => {
		let courseA;
		let courseB;
		let studentA;
		let studentAParams;
		let studentB;
		let studentBParams;
		let teacherA;
		let teacherAParams;
		let teacherB;
		let teacherBParams;
		let materialA;
		let materialB;

		before(async () => {
			[materialA, materialB] = await Promise.all([
				Material.create({
					title: 'Afoo',
					client: 'Abar',
					url: 'Abaz',
				}),
				Material.create({
					title: 'Bfoo',
					client: 'Bbar',
					url: 'Bbaz',
				}),
			]);

			[studentA, studentB] = await Promise.all([
				testObjects.createTestUser({ roles: 'student' }),
				testObjects.createTestUser({ roles: 'student' }),
			]);
			[teacherA, teacherB] = await Promise.all([
				testObjects.createTestUser({ roles: 'teacher' }),
				testObjects.createTestUser({ roles: 'teacher' }),
			]);

			studentBParams = await testObjects.generateRequestParamsFromUser(studentB);
			studentAParams = await testObjects.generateRequestParamsFromUser(studentA);
			teacherAParams = await testObjects.generateRequestParamsFromUser(teacherA);
			teacherBParams = await testObjects.generateRequestParamsFromUser(teacherB);

			[courseA, courseB] = await Promise.all([
				testObjects.createTestCourse({ teacherIds: [teacherA], userIds: [studentA] }),
				testObjects.createTestCourse({ teacherIds: [teacherB], userIds: [studentB] }),
			]);
			await Promise.all([
				testObjects.createTestLesson({ courseId: courseA._id, materialIds: [materialA] }),
				testObjects.createTestLesson({ courseId: courseB._id, materialIds: [materialB] }),
			]);
		});

		after(async () => {
			await Material.deleteMany({
				_id: { $in: [materialA._id, materialB._id] },
			});

			testObjects.cleanup();
		});

		it('enables accessing material via ID for courses the user has access to', async () => {
			const studentResult = await app.service('materials').get(materialA._id, studentAParams);
			expect(studentResult.title).to.equal(materialA.title);

			const teacherResult = await app.service('materials').get(materialA._id, teacherAParams);
			expect(teacherResult.title).to.equal(materialA.title);
		});

		// This test should be tested the checkAssociatedCoursePermissionForSearchResult hock. But the setup can not work like it is now.
		// Need to be fixed, but deeper understand of course, lesson mechanic for analysing the result context.
		it.skip('allows to find only materials associated to courses a user has access to', async () => {
			const queryA = { query: {}, ...studentAParams };
			const resultsStudentA = await app.service('materials').find(queryA);
			expect(resultsStudentA.total, 'result for student A from course A').to.equal(1);
			expect(resultsStudentA.data[0].title).to.equal(materialA.title);

			const queryB = { query: {}, ...teacherBParams };
			const resultsTeacherB = await app.service('materials').find(queryB);
			expect(resultsTeacherB.total, 'result for teacher B from course B').to.equal(1);
			expect(resultsTeacherB.data[0].url).to.equal(materialB.url);
		});

		it('prohibits access to materials of courses a user is not a member of', async () => {
			try {
				await app.service('materials').get(materialA._id, studentBParams);
				throw new Error('This should not happen');
			} catch (err) {
				expect(err).to.be.instanceOf(Forbidden);
				expect(err.message).to.equal('No permision to access this material');
			}

			try {
				await app.service('materials').get(materialA._id, teacherBParams);
				throw new Error('This should not happen');
			} catch (err) {
				expect(err).to.be.instanceOf(Forbidden);
				expect(err.message).to.equal('No permision to access this material');
			}
		});

		it('allows changing a material if it is associated to a teachers course', async () => {
			const patched = await app.service('materials').patch(materialB._id, { title: 'changed' }, teacherBParams);
			expect(patched.title).to.equal('changed');
		});

		it('prohibits changing a material if it is not associated to a user via a course', async () => {
			try {
				await app.service('materials').patch(materialB._id, { title: 'changed' }, teacherAParams);
				throw new Error('This should not happen');
			} catch (err) {
				expect(err).to.be.instanceOf(Forbidden);
				expect(err.message).to.equal('No permision to access this material');
			}
		});

		it('prohibits removing a material if it is not associated to a user via a course', async () => {
			try {
				await app.service('materials').remove(materialB._id, teacherAParams);
				throw new Error('This should not happen');
			} catch (err) {
				expect(err).to.be.instanceOf(Forbidden);
				expect(err.message).to.equal('No permision to access this material');
			}
		});

		it('prohibits changing a material by students even from associated courses', async () => {
			try {
				await app.service('materials').patch(materialB._id, { title: 'changed' }, studentBParams);
				throw new Error('This should not happen');
			} catch (err) {
				expect(err).to.be.instanceOf(Forbidden);
				expect(err.message).to.equal('No permision to access this material');
			}
		});
	});
});
