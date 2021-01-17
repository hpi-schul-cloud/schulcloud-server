const assert = require('assert');
const { expect } = require('chai');

const { Forbidden } = require('../../../src/errors');

const appPromise = require('../../../src/app');
const Material = require('../../../src/services/content/material-model');

const {
	cleanup,
	createTestCourse,
	createTestUser,
	createTestLesson,
	generateRequestParamsFromUser,
} = require('../helpers/testObjects')(appPromise);

describe('material service', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await cleanup();
		await server.close();
	});

	it('registered the material service', () => {
		assert.ok(app.service('materials'));
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
				createTestUser({ roles: 'student' }),
				createTestUser({ roles: 'student' }),
			]);

			[teacherA, teacherB] = await Promise.all([
				createTestUser({ roles: 'teacher' }),
				createTestUser({ roles: 'teacher' }),
			]);

			[studentAParams, studentBParams, teacherAParams, teacherBParams] = await Promise.all([
				generateRequestParamsFromUser(studentA),
				generateRequestParamsFromUser(studentB),
				generateRequestParamsFromUser(teacherA),
				generateRequestParamsFromUser(teacherB),
			]);

			[courseA, courseB] = await Promise.all([
				createTestCourse({ teacherIds: [teacherA], userIds: [studentA] }),
				createTestCourse({ teacherIds: [teacherB], userIds: [studentB] }),
			]);

			await Promise.all([
				createTestLesson({ courseId: courseA._id, materialIds: [materialA] }),
				createTestLesson({ courseId: courseB._id, materialIds: [materialB] }),
			]);
		});

		it('enables accessing material via ID for courses the user has access to', async () => {
			const studentResult = await app.service('materials').get(materialA._id, studentAParams);
			expect(studentResult.title).to.equal(materialA.title);

			const teacherResult = await app.service('materials').get(materialA._id, teacherAParams);
			expect(teacherResult.title).to.equal(materialA.title);
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

		it('allows to find only materials associated to courses a user has access to', async () => {
			const resultsStudentA = await app.service('materials').find({ query: {}, ...studentAParams });
			expect(resultsStudentA.total).to.equal(1);
			expect(resultsStudentA.data[0].title).to.equal(materialA.title);

			const resultsTeacherB = await app.service('materials').find({ query: {}, ...teacherBParams });
			expect(resultsTeacherB.total).to.equal(1);
			expect(resultsTeacherB.data[0].url).to.equal(materialB.url);
		});

		after(async () => {
			await Material.deleteMany({
				_id: { $in: [materialA._id, materialB._id] },
			});
		});
	});
});
