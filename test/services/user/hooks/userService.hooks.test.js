const { expect } = require('chai');

const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const {
	removeStudentFromCourses, removeStudentFromClasses,
} = require('../../../../src/services/user/hooks/userService');

describe('removeStudentFromCourses', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	it('removes single student from all his courses', async () => {
		const user = await testObjects.createTestUser({ roles: ['student'] });
		const courses = await Promise.all([
			testObjects.createTestCourse({ userIds: [user._id] }),
			testObjects.createTestCourse({ userIds: [user._id] }),
		]);
		await removeStudentFromCourses({ id: user._id, app });
		const { data: updatedCourses } = await app.service('courses').find({
			query: { _id: { $in: courses.map((c) => c._id) } },
		});

		expect(updatedCourses.length).to.equal(2);
		const userInAnyCourse = updatedCourses.some(
			(course) => course.userIds.some(
				(id) => id.toString() === user._id.toString(),
			),
		);
		expect(userInAnyCourse).to.equal(false);
	});

	it('removes multiple students from all their courses', async () => {
		const { _id: firstId } = await testObjects.createTestUser({ roles: ['student'] });
		const { _id: secondId } = await testObjects.createTestUser({ roles: ['student'] });
		const courses = await Promise.all([
			testObjects.createTestCourse({ userIds: [firstId._id] }),
			testObjects.createTestCourse({ userIds: [firstId._id, secondId._id] }),
			testObjects.createTestCourse({ userIds: [secondId._id] }),
		]);
		await removeStudentFromCourses({ id: null, result: [{ _id: firstId }, { _id: secondId }], app });
		const { data: updatedCourses } = await app.service('courses').find({
			query: { _id: { $in: courses.map((c) => c._id) } },
		});
		expect(updatedCourses.length).to.equal(3);
		const userInAnyCourse = updatedCourses.some(
			(course) => course.userIds.some(
				(id) => (
					id.toString() === firstId._id.toString()
					|| id.toString() === secondId._id.toString()),
			),
		);
		expect(userInAnyCourse).to.equal(false);
	});
});

describe('removeStudentFromClasses', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	it('removes single student from all his classes', async () => {
		const user = await testObjects.createTestUser({ roles: ['student'] });
		const classes = await Promise.all([
			testObjects.createTestClass({ userIds: [user._id] }),
			testObjects.createTestClass({ userIds: [user._id] }),
		]);
		await removeStudentFromClasses({ id: user._id, app });
		const { data: updatedClasses } = await app.service('classes').find({
			query: { _id: { $in: classes.map((c) => c._id) } },
		});

		expect(updatedClasses.length).to.equal(2);
		const userInAnyClass = updatedClasses.some(
			(klass) => klass.userIds.some(
				(id) => id.toString() === user._id.toString(),
			),
		);
		expect(userInAnyClass).to.equal(false);
	});

	it('removes multiple students from all their classes', async () => {
		const { _id: firstId } = await testObjects.createTestUser({ roles: ['student'] });
		const { _id: secondId } = await testObjects.createTestUser({ roles: ['student'] });
		const classes = await Promise.all([
			testObjects.createTestClass({ userIds: [firstId._id] }),
			testObjects.createTestClass({ userIds: [firstId._id, secondId._id] }),
			testObjects.createTestClass({ userIds: [secondId._id] }),
		]);
		await removeStudentFromClasses({ id: null, result: [{ _id: firstId }, { _id: secondId }], app });
		const { data: updatedClasses } = await app.service('classes').find({
			query: { _id: { $in: classes.map((c) => c._id) } },
		});
		expect(updatedClasses.length).to.equal(3);
		const userInAnyClass = updatedClasses.some(
			(klass) => klass.userIds.some(
				(id) => (
					id.toString() === firstId._id.toString()
					|| id.toString() === secondId._id.toString()),
			),
		);
		expect(userInAnyClass).to.equal(false);
	});
});
