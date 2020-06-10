const assert = require('assert');
const { expect } = require('chai');
const { Configuration } = require('@schul-cloud/commons');
const app = require('../../../../src/app');

const userService = app.service('users');
const classesService = app.service('classes');
const coursesService = app.service('courses');
const testObjects = require('../../helpers/testObjects')(app);
const { equal: equalIds } = require('../../../../src/helper/compare').ObjectId;

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

	it('resolves permissions and attributes correctly', () => {
		function createTestBase() {
			return app.service('roles')
				.create({
					name: 'test_base',
					roles: [],
					permissions: [
						'TEST_BASE',
						'TEST_BASE_2',
					],
				});
		}

		function createTestSubrole(testBase) {
			return app.service('roles')
				.create({
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
	describe('GET', () => {
		it('student can read himself', async () => {
			const student = await testObjects.createTestUser({
				roles: ['student'], birthday: Date.now(), ldapId: 'thisisauniqueid',
			});
			const params = await testObjects.generateRequestParamsFromUser(student);
			params.query = {};
			const result = await app.service('users').get(student._id, params);
			expect(result).to.not.be.undefined;
			expect(result).to.haveOwnProperty('firstName');
			expect(result).to.haveOwnProperty('lastName');
			expect(result).to.haveOwnProperty('displayName');
			expect(result).to.haveOwnProperty('email');
			expect(result).to.haveOwnProperty('birthday');
			expect(result).to.haveOwnProperty('ldapId');
		});

		it('student can read other student with STUDENT_LIST permission', async () => {
			await testObjects.createTestRole({
				name: 'studentList', permissions: ['STUDENT_LIST'],
			});
			const student = await testObjects.createTestUser({ roles: ['studentList'] });
			const otherStudent = await testObjects.createTestUser({ roles: ['student'], birthday: Date.now() });
			const params = await testObjects.generateRequestParamsFromUser(student);
			params.query = {};
			const result = await app.service('users').get(otherStudent._id, params);
			expect(result).to.not.be.undefined;
			expect(result).to.haveOwnProperty('firstName');
			expect(result).to.haveOwnProperty('lastName');
			expect(result).to.haveOwnProperty('displayName');
			expect(result).not.to.haveOwnProperty('email');
			expect(result).not.to.haveOwnProperty('birthday');
			expect(result).not.to.haveOwnProperty('ldapId');
		});

		it('teacher can read student', async () => {
			const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
			const student = await testObjects.createTestUser({ roles: ['student'], birthday: Date.now() });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = {};
			const result = await app.service('users').get(student._id, params);
			expect(result).to.not.be.undefined;
			expect(result).to.haveOwnProperty('firstName');
			expect(result).to.haveOwnProperty('lastName');
			expect(result).to.haveOwnProperty('displayName');
			expect(result).to.haveOwnProperty('email');
			expect(result).to.haveOwnProperty('birthday');
			expect(result).not.to.haveOwnProperty('ldapId');
		});

		it('does not allow students to read other students without STUDENT_LIST permission', async () => {
			await testObjects.createTestRole({ name: 'notAuthorized', permissions: [] });
			const studentToRead = await testObjects.createTestUser({ roles: ['student'] });
			const actingUser = await testObjects.createTestUser({ roles: ['notAuthorized'] });
			const params = await testObjects.generateRequestParamsFromUser(actingUser);
			params.query = {};
			try {
				await app.service('users').get(studentToRead._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal('You don\'t have one of the permissions: STUDENT_LIST.');
			}
		});
	});

	describe('FIND', () => {
		it('does not allow teachers to find parents', async () => {
			const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
			const parent = await testObjects.createTestUser({ roles: ['parent'] });

			const teacherParams = await testObjects.generateRequestParamsFromUser(teacher);
			teacherParams.query = {};
			const result = await app.service('users').find(teacherParams);
			expect(result.data.some((r) => equalIds(r._id, parent._id))).to.be.false;
		});

		it('does not allow students who may not create teams list other users', async () => {
			const student = await testObjects.createTestUser({ roles: ['student'] });
			const studentParams = await testObjects.generateRequestParamsFromUser(student);
			studentParams.query = {};

			await app.service('schools').patch(
				student.schoolId,
				{ enableStudentTeamCreation: false },
			);

			try {
				await app.service('users').find(studentParams);
				assert.fail('students who maynot create a team are not allowed to list other users');
			} catch (error) {
				expect(error.code).to.equal(403);
				expect(error.message).to.equal('The current user is not allowed to list other users!');
			}
		});

		it('allows students who may create teams list other users', async () => {
			const student = await testObjects.createTestUser({ roles: ['student'] });
			const studentParams = await testObjects.generateRequestParamsFromUser(student);
			studentParams.query = {};

			await app.service('schools').patch(
				student.schoolId,
				{ enableStudentTeamCreation: true },
			);

			const studentResults = await app.service('users').find(studentParams);
			expect(studentResults.data).to.be.not.empty;
		});

		it('allows access to parents by superheroes', async () => {
			const hero = await testObjects.createTestUser({ roles: ['superhero'] });
			const parent = await testObjects.createTestUser({ roles: ['parent'] });

			const params = await testObjects.generateRequestParamsFromUser(hero);
			params.query = {};
			const result = await app.service('users').find(params);
			expect(result.data.some((r) => equalIds(r._id, parent._id))).to.be.true;
		});
	});

	describe('CREATE', () => {
		it('can create student with STUDENT_CREATE', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			await testObjects.createTestRole({
				name: 'studentCreate', permissions: ['STUDENT_CREATE'],
			});
			const actingUser = await testObjects.createTestUser({ roles: ['studentCreate'], schoolId });
			const params = await testObjects.generateRequestParamsFromUser(actingUser);
			const data = {
				firstName: 'Luke',
				lastName: 'Skywalker',
				schoolId,
				roles: ['student'],
				email: `${Date.now()}@test.org`,
			};
			const result = await app.service('users').create(data, params);
			expect(result).to.not.be.undefined;
			expect(result._id).to.not.be.undefined;
		});

		it('can fails to create user on other school', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const { _id: otherSchoolId } = await testObjects.createTestSchool();
			await testObjects.createTestRole({
				name: 'studentCreate', permissions: ['STUDENT_CREATE'],
			});
			const actingUser = await testObjects.createTestUser({ roles: ['studentCreate'], schoolId });
			const params = await testObjects.generateRequestParamsFromUser(actingUser);
			const data = {
				firstName: 'Leia',
				lastName: 'Skywalker',
				schoolId: otherSchoolId,
				roles: ['student'],
				email: `${Date.now()}@test.org`,
			};
			try {
				await app.service('users').create(data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal('You do not have valid permissions to access this.');
			}
		});

		it('superhero can create admin', async () => {
			const hero = await testObjects.createTestUser({ roles: ['superhero'] });
			const { _id: schoolId } = await testObjects.createTestSchool();
			const params = await testObjects.generateRequestParamsFromUser(hero);
			const user = await app.service('users').create({
				schoolId,
				email: `${Date.now()}@testadmin.org`,
				firstName: 'Max',
				lastName: 'Tester',
				roles: [
					'administrator',
				],
			}, params);
			expect(user).to.not.equal(undefined);
			expect(user._id).to.not.equal(undefined);
		});
	});

	describe('PATCH', () => {
		it('rejects on group patching', async () => {
			await userService.patch(null, { email: 'test' }).catch((err) => {
				expect(err).to.not.equal(undefined);
				expect(err.message).to.equal('Operation on this service requires an id!');
			});
		});

		it('student can edit himself', async () => {
			const student = await testObjects.createTestUser({ roles: ['student'] });
			const params = await testObjects.generateRequestParamsFromUser(student);
			params.query = {};
			const result = await app.service('users').patch(student._id, { firstName: 'Bruce' }, params);
			expect(result).to.not.be.undefined;
			expect(result.firstName).to.equal('Bruce');
		});

		it('fail to patch user on other school', async () => {
			const school = await testObjects.createTestSchool();
			const otherSchool = await testObjects.createTestSchool();
			const studentToDelete = await testObjects.createTestUser({ roles: ['student'], schoolId: otherSchool._id });
			const actingUser = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
			const params = await testObjects.generateRequestParamsFromUser(actingUser);

			try {
				await app.service('users').patch(studentToDelete._id, { lastName: 'Vader' }, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(404);
				expect(err.message).to.equal(`no record found for id '${studentToDelete._id.toString()}'`);
			}
		});
	});

	describe('REMOVE', () => {
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
			params.headers = { 'x-api-key': Configuration.get('CLIENT_API_KEY') }; // toDO remove with SC-4112
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
			params.headers = { 'x-api-key': Configuration.get('CLIENT_API_KEY') }; // toDO remove with SC-4112
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
			params.headers = { 'x-api-key': Configuration.get('CLIENT_API_KEY') }; // toDO remove with SC-4112
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
			params.headers = { 'x-api-key': Configuration.get('CLIENT_API_KEY') }; // toDO remove with SC-4112
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

		it('fail to delete user on other school', async () => {
			const school = await testObjects.createTestSchool();
			const otherSchool = await testObjects.createTestSchool();
			const studentToDelete = await testObjects.createTestUser({ roles: ['student'], schoolId: otherSchool._id });
			const actingUser = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });
			const params = await testObjects.generateRequestParamsFromUser(actingUser);
			params.query = {};
			try {
				await app.service('users').remove(studentToDelete._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(404);
				expect(err.message).to.equal(`no record found for id '${studentToDelete._id.toString()}'`);
			}
		});
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
			params.headers = { 'x-api-key': Configuration.get('CLIENT_API_KEY') }; // toDO remove with SC-4112
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
			params.headers = { 'x-api-key': Configuration.get('CLIENT_API_KEY') }; // toDO remove with SC-4112
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
