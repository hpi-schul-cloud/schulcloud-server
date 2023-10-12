const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons/lib');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise());
const {
	restrictChangesToArchivedCourse,
	addWholeClassToCourse,
} = require('../../../../src/services/user-group/hooks/courses');
const { setupNestServices } = require('../../../utils/setup.nest.services');

const oneHour = 600000;
const twoDays = 172800000;

describe('course hooks', () => {
	let app;
	let server;
	let nestServices;

	before(async () => {
		app = await appPromise();
		nestServices = await setupNestServices(app);
		server = app.listen(0);
	});

	after(() => {
		server.close();
	});

	describe('restrict changes to archived course', () => {
		const fut = restrictChangesToArchivedCourse;

		it('returns for course that is not expired', async () => {
			const activeCourse = await testObjects.createTestCourse({
				untilDate: Date.now() + oneHour,
			});
			const result = await fut({ app, method: 'update', id: activeCourse._id });
			expect(result).to.not.equal(undefined);
			expect(result.app).to.not.equal(undefined);
			expect(result.method).to.not.equal(undefined);
			expect(result.id).to.not.equal(undefined);
		});

		it('returns for course without end date', async () => {
			const activeCourse = await testObjects.createTestCourse({});
			const result = await fut({ app, method: 'update', id: activeCourse._id });
			expect(result).to.not.equal(undefined);
			expect(result.app).to.not.equal(undefined);
			expect(result.method).to.not.equal(undefined);
			expect(result.id).to.not.equal(undefined);
		});

		it('returns when changing untilDate on expired course', async () => {
			const archivedCourse = await testObjects.createTestCourse({
				untilDate: Date.now() - twoDays,
			});
			const result = await fut({
				app,
				method: 'update',
				id: archivedCourse._id,
				data: {
					startDate: Date.now() - twoDays,
					untilDate: Date.now() + oneHour,
				},
			});
			expect(result).to.not.equal(undefined);
			expect(result.app).to.not.equal(undefined);
			expect(result.method).to.not.equal(undefined);
			expect(result.id).to.not.equal(undefined);
		});

		it('fails when changing other fields of expired course', async () => {
			try {
				const archivedCourse = await testObjects.createTestCourse({
					untilDate: Date.now() - twoDays,
				});
				await fut({
					app,
					method: 'update',
					id: archivedCourse._id,
					data: {
						startDate: Date.now() - twoDays,
						untilDate: Date.now() + oneHour,
						otherField: 'this is set',
					},
				});
				throw new Error('should have failed');
			} catch (err) {
				expect(err).to.not.equal(undefined);
				expect(err.message).to.not.equal('should have failed');
			}
		});
	});

	describe('add whole class to course', () => {
		describe('when FEATURE_GROUPS_IN_COURSE_ENABLED is enabled and group are given', async () => {
			const setup = async () => {
				Configuration.set('FEATURE_GROUPS_IN_COURSE_ENABLED', true);
				const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
				const student = await testObjects.createTestUser({ roles: ['student'] });
				const student1 = await testObjects.createTestUser({ roles: ['student'] });
				const student2 = await testObjects.createTestUser({ roles: ['student'] });
				const class1 = await testObjects.createTestClass({ teacherIds: [teacher._id] });
				const class2 = await testObjects.createTestClass({ teacherIds: [teacher._id], userIds: [student2._id] });
				const group1 = await testObjects.createTestCourseGroup({
					teacherIds: [teacher._id],
					userIds: [student._id, student1._id],
				});

				return { teacher, student, class1, class2, group1 };
			};
			it('should add classmembers and groupmembers to course hook', async () => {
				const { class1, class2, group1 } = await setup();
				const result = addWholeClassToCourse({
					app,
					method: 'update',
					id: '123',
					data: { groupIds: [group1._id], classIds: [class1._id, class2._id] },
				});
				expect(result).to.not.equal(undefined);
				expect(result.teacherIds).to.have.length(1);
				expect(result.userIds).to.have.length(3);
			});
		});

		describe('when FEATURE_GROUPS_IN_COURSE_ENABLED is enabled and group are not given', async () => {
			const setup = async () => {
				Configuration.set('FEATURE_GROUPS_IN_COURSE_ENABLED', true);
				const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
				const student = await testObjects.createTestUser({ roles: ['student'] });
				const class1 = await testObjects.createTestClass({ teacherIds: [teacher._id] });
				const class2 = await testObjects.createTestClass({ teacherIds: [teacher._id] });

				return { teacher, student, class1, class2 };
			};

			it('should add classmembers and groupmembers to course hook', async () => {
				const { class1, class2 } = await setup();
				const result = addWholeClassToCourse({
					app,
					method: 'update',
					id: '123',
					data: { groupIds: undefined, classIds: [class1._id, class2._id] },
				});
				expect(result).to.not.equal(undefined);
				expect(result.teacherIds).to.have.length(1);
				expect(result.userIds).to.have.length(0);
			});
		});

		describe('when FEATURE_GROUPS_IN_COURSE_ENABLED is disabled', async () => {
			const setup = async () => {
				Configuration.set('FEATURE_GROUPS_IN_COURSE_ENABLED', false);
				const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
				const student = await testObjects.createTestUser({ roles: ['student'] });
				const student1 = await testObjects.createTestUser({ roles: ['student'] });
				const student2 = await testObjects.createTestUser({ roles: ['student'] });
				const class1 = await testObjects.createTestClass({ teacherIds: [teacher._id] });
				const group1 = await testObjects.createTestCourseGroup({
					teacherIds: [teacher._id],
					userIds: [student._id, student1._id, student2._id],
				});

				return { teacher, student, class1, group1 };
			};
			it('should add classmembers and groupmembers to course hook', async () => {
				const { class1, group1 } = await setup();
				const result = addWholeClassToCourse({
					app,
					method: 'update',
					id: '123',
					data: { groupIds: [group1._id], classIds: [class1._id] },
				});
				expect(result.teacherIds).to.not.equal(undefined);
				expect(result.teacherIds).to.have.length(1);
				expect(result.userIds).to.have.length(0);
			});
		});
	});
});
