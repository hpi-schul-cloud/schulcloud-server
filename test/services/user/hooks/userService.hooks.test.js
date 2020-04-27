const { expect } = require('chai');

const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const {
	removeStudentFromCourses, removeStudentFromClasses, generateRegistrationLink, sendRegistrationLink,
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

describe('generateRegistrationLink', () => {
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

	const expectedErrorMessage = 'Roles must be exactly of length one if generateRegistrationLink=true is set.';

	const getAppMock = (registrationlinkMock) => ({
		service: (service) => {
			if (service === '/registrationlink') {
				return ({
					create: async (data) => registrationlinkMock(data),
				});
			}
			throw new Error('unknown service');
		},
	});

	it('throws an error if roles is not defined', async () => {
		const context = {
			data: {
				generateRegistrationLink: true,
			},
		};
		try {
			await generateRegistrationLink(context);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(400);
			expect(err.message).to.equal(expectedErrorMessage);
		}
	});

	it('throws an error if user has more than one role', async () => {
		const context = {
			data: {
				generateRegistrationLink: true,
				roles: ['student', 'teacher'],
			},
		};
		try {
			await generateRegistrationLink(context);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(400);
			expect(err.message).to.equal(expectedErrorMessage);
		}
	});

	it('catches errors from /registrationlink', async () => {
		const context = {
			app: getAppMock(() => { throw new Error('test error'); }),
			data: {
				generateRegistrationLink: true,
				roles: ['student'],
			},
		};
		try {
			await generateRegistrationLink(context);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(500);
			expect(err.message).to.equal('Can not create registrationlink. Error: test error');
		}
	});

	it('appends generated hash as importHash to context.data', async () => {
		const expectedHash = 'testhash';
		const userData = {
			roles: ['student'],
			schoolId: 'schoolId',
			email: 'user@email.de',
		};
		const context = {
			app: getAppMock((data) => {
				if (data.role === userData.roles[0]
					&& data.save === true
					&& data.patchUser === true
					&& data.host
					&& data.schoolId === userData.schoolId
					&& data.toHash === userData.email
				) {
					return { hash: expectedHash };
				}
				throw new Error('wrong arguments passed to CREATE /registrationlink');
			}),
			data: {
				...userData,
				generateRegistrationLink: true,
			},
		};
		await generateRegistrationLink(context);
		expect(context.data.importHash).to.equal(expectedHash);
	});
});

describe('sendRegistrationLink', () => {
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


	const getAppMock = (registrationlinkMock) => ({
		service: (service) => {
			if (service === '/registrationlink') {
				return ({
					create: async (data) => registrationlinkMock(data),
				});
			}
			if (service === '/users') {
				return 	{ find: async () => {} };
			}
			if (service === '/mails') {
				return { create: async () => {} };
			}

			throw new Error('unknown service');
		},
	});

	it('sends a registration link to the customer', async () => {
		const expectedHash = 'testhash';
		const userData = {
			roles: ['student'],
			schoolId: 'schoolId',
			email: 'user@email.de',
			firstName: 'John',
			lastName: 'Doe',
		};
		const context = {
			app: getAppMock((data) => {
				if (data.role === userData.roles[0]
					&& data.save === true
					&& data.patchUser === true
					&& data.host
					&& data.schoolId === userData.schoolId
					&& data.toHash === userData.email
				) {
					return { hash: expectedHash };
				}
				throw new Error('wrong arguments passed to CREATE /registrationlink');
			}),
			data: {
				...userData,
				generateRegistrationLink: true,
			},
		};
		await sendRegistrationLink(context);
		expect(context.data.importHash).to.equal(expectedHash);
		expect(context.data.registrationLinkSent).to.equal(true);
	});
});
