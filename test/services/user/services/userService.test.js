const assert = require('assert');
const { expect } = require('chai');
const app = require('../../../../src/app');

const userService = app.service('users');
const classesService = app.service('classes');
const coursesService = app.service('courses');
const testObjects = require('../../helpers/testObjects')(app);

let testUserId;

describe('user service', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	it('registered the users service', () => {
		assert.ok(userService);
		assert.ok(classesService);
		assert.ok(coursesService);
	});

	it('rejects on group patching', async () => {
		await userService.patch(null, { email: 'test' }).catch((err) => {
			expect(err).to.not.equal(undefined);
			expect(err.message).to.equal('Operation on this service requires an id!');
		});
	});

	it('resolves permissions and attributes correctly', () => {
		function createTestBase() {
			return testObjects.createTestRole({
				name: 'test_base',
				roles: [],
				permissions: [
					'TEST_BASE',
					'TEST_BASE_2',
				],
			});
		}

		function createTestSubrole(testBase) {
			return testObjects.createTestRole({
				name: 'test_subrole',
				roles: [testBase._id],
				permissions: [
					'TEST_SUB',
				],
			});
		}

		return createTestBase()
			.then((testBase) => createTestSubrole(testBase))
			.then((testSubrole) => testObjects.createTestUser({
				id: '0000d231816abba584714d01',
				accounts: [],
				schoolId: '0000d186816abba584714c5f',
				email: 'user@testusers.net',
				firstName: 'Max',
				lastName: 'Tester',
				roles: [
					testSubrole._id,
				],
				manualCleanup: true,
			}))
			.then((user) => userService.get(user._id))
			.then((user) => {
				testUserId = user._id;
				expect(user.avatarInitials).to.eq('MT');
				const array = Array.from(user.permissions);
				expect(array).to.have.lengthOf(3);
				expect(array).to.include('TEST_BASE', 'TEST_BASE_2', 'TEST_SUB');
			});
	});

	it('user gets removed from classes and courses after delete', async () => {
		const userToDelete = await testObjects.createTestUser({ roles: ['student'] });
		const { _id: classId } = await testObjects.createTestClass({ userIds: userToDelete._id });
		const { _id: courseId } = await testObjects.createTestCourse({ userIds: userToDelete._id });

		await userService.remove(testUserId);

		const [course, klass] = await Promise.all([
			classesService.get(classId),
			coursesService.get(courseId),
		]);

		expect(course.userIds.map((id) => id.toString())).to.not.include(testUserId.toString());
		expect(klass.userIds.map((id) => id.toString())).to.not.include(testUserId.toString());
	});

	it('fail to delete single student without STUDENT_DELETE permission', async () => {
		await testObjects.createTestRole({ name: 'notAuthorized', permissions: [] });
		const studentToDelete = await testObjects.createTestUser({ roles: ['student'] });
		const actingUser = await testObjects.createTestUser({ roles: ['notAuthorized'] });
		const params = await testObjects.generateRequestParamsFromUser(actingUser);
		params.query = {};
		try {
			await app.service('users').remove(studentToDelete._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal('you dont have permission to delete this user!');
		}
	});

	it('can delete single student with STUDENT_DELETE permission', async () => {
		await testObjects.createTestRole({
			name: 'studentDelete', permissions: ['STUDENT_DELETE'],
		});
		const studentToDelete = await testObjects.createTestUser({ roles: ['student'], manualCleanup: true });
		const actingUser = await testObjects.createTestUser({ roles: ['studentDelete'] });
		const params = await testObjects.generateRequestParamsFromUser(actingUser);
		params.query = {};
		try {
			const result = await app.service('users').remove(studentToDelete._id, params);
			expect(result).to.not.be.undefined;
			expect(result._id.toString()).to.equal(studentToDelete._id.toString());
		} catch (err) {
			// in case of error, make sure user gets deleted
			testObjects.createdUserIds.push(studentToDelete._id);
			throw new Error('should not have failed');
		}
	});

	it('fail to  single teacher without TEACHER_DELETE permission', async () => {
		await testObjects.createTestRole({ name: 'notAuthorized', permissions: ['STUDENT_DELETE'] });
		const studentToDelete = await testObjects.createTestUser({ roles: ['teacher'] });
		const actingUser = await testObjects.createTestUser({ roles: ['notAuthorized'] });
		const params = await testObjects.generateRequestParamsFromUser(actingUser);
		params.query = {};
		try {
			await app.service('users').remove(studentToDelete._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal('you dont have permission to delete this user!');
		}
	});

	it('can delete single teacher with TEACHER_DELETE permission', async () => {
		await testObjects.createTestRole({
			name: 'teacherDelete', permissions: ['TEACHER_DELETE'],
		});
		const studentToDelete = await testObjects.createTestUser({ roles: ['teacher'], manualCleanup: true });
		const actingUser = await testObjects.createTestUser({ roles: ['teacherDelete'] });
		const params = await testObjects.generateRequestParamsFromUser(actingUser);
		params.query = {};
		try {
			const result = await app.service('users').remove(studentToDelete._id, params);
			expect(result).to.not.be.undefined;
			expect(result._id.toString()).to.equal(studentToDelete._id.toString());
		} catch (err) {
			// in case of error, make sure user gets deleted
			testObjects.createdUserIds.push(studentToDelete._id);
			throw new Error('should not have failed');
		}
	});

	describe('bulk delete', () => {
		it('can delete multiple students when user has STUDENT_DELETE permission', async () => {
			await testObjects.createTestRole({
				name: 'studentDelete', permissions: ['STUDENT_DELETE'],
			});
			const userIds = await Promise.all([
				testObjects.createTestUser({ roles: ['student'], manualCleanup: true }).then((u) => u._id),
				testObjects.createTestUser({ roles: ['student'], manualCleanup: true }).then((u) => u._id),
			]);
			const actingUser = await testObjects.createTestUser({ roles: ['studentDelete'] });
			const params = await testObjects.generateRequestParamsFromUser(actingUser);
			params.query = { _id: { $in: userIds } };
			let result;
			try {
				result = await app.service('users').remove(null, params);
			} catch (err) {
				testObjects.createdUserIds.concat(userIds);
				throw new Error('should not have failed', err);
			}
			expect(result).to.not.be.undefined;
			expect(Array.isArray(result)).to.equal(true);
			const resultUserIds = result.map((e) => e._id.toString());
			userIds.forEach((userId) => expect(resultUserIds).to.include(userId.toString()));
		});

		it('only deletes students when user has STUDENT_DELETE permission', async () => {
			await testObjects.createTestRole({
				name: 'studentDelete', permissions: ['STUDENT_DELETE'],
			});
			const userIds = await Promise.all([
				testObjects.createTestUser({ roles: ['student'], manualCleanup: true }).then((u) => u._id),
				testObjects.createTestUser({ roles: ['teacher'] }).then((u) => u._id),
			]);
			const actingUser = await testObjects.createTestUser({ roles: ['studentDelete'] });
			const params = await testObjects.generateRequestParamsFromUser(actingUser);
			params.query = { _id: { $in: userIds } };
			let result;
			try {
				result = await app.service('users').remove(null, params);
			} catch (err) {
				testObjects.createdUserIds.concat(userIds);
				throw new Error('should not have failed', err);
			}
			expect(result).to.not.be.undefined;
			expect(Array.isArray(result)).to.equal(true);
			const resultUserIds = result.map((e) => e._id.toString());
			expect(resultUserIds).to.include(userIds[0].toString());
			expect(resultUserIds).to.not.include(userIds[1].toString());
		});
	});

	describe('uniqueness check', () => {
		it('should reject new users with mixed-case variants of existing usernames', async () => {
			await testObjects.createTestUser({ email: 'existing@account.de' });
			const newUser = {
				firstName: 'Test',
				lastName: 'Testington',
				email: 'ExistinG@aCCount.de',
				schoolId: '0000d186816abba584714c5f',
			};

			await new Promise((resolve, reject) => {
				testObjects.createTestUser(newUser)
					.then(() => {
						// eslint-disable-next-line max-len
						reject(new Error('This call should fail because of an already existing user with the same email'));
					})
					.catch((err) => {
						// eslint-disable-next-line max-len
						expect(err.message).to.equal('Die E-Mail Adresse ExistinG@aCCount.de ist bereits in Verwendung!');
						resolve();
					});
			});
		});
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});
});
