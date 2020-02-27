const assert = require('assert');
const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;

const { Configuration } = require('@schul-cloud/commons');
const app = require('../../../src/app');

const userService = app.service('users');
const registrationPinService = app.service('registrationPins');
const publicTeachersService = app.service('publicTeachers');
const classesService = app.service('classes');
const coursesService = app.service('courses');
const testObjects = require('../helpers/testObjects')(app);

let testUserId;

describe('user service', () => {
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

	it('deletes user correctly', async () => {
		const demoClass = (await classesService.find({ query: { name: 'Demo-Klasse', $limit: 1 } })).data[0];
		const demoCourse = (await coursesService.find({ query: { name: 'Mathe', $limit: 1 } })).data[0];

		await userService.remove(testUserId);

		expect(demoClass.userIds).to.not.include(testUserId);
		expect(demoCourse.userIds).to.not.include(testUserId);
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

	after(async () => {
		await testObjects.cleanup();
	});
});

describe('registrationPin Service', () => {
	it('registered the registrationPin Service', () => {
		assert.ok(registrationPinService);
	});

	it('creates pins correctly', () => registrationPinService
		.create({ email: 'test.adresse@schul-cloud.org' })
		.then(() => registrationPinService.find({ query: { email: 'test.adresse@schul-cloud.org' } }))
		.then((pinObjects) => expect(pinObjects.data[0]).to.have.property('pin')));

	it('overwrites old pins', () => registrationPinService.create({ email: 'test.adresse@schul-cloud.org' })
		.then(() => registrationPinService.create({ email: 'test.adresse@schul-cloud.org' }))
		.then(() => registrationPinService.find({ query: { email: 'test.adresse@schul-cloud.org' } }))
		.then((pinObjects) => expect(pinObjects.data).to.have.lengthOf(1)));
});

describe('publicTeachers service', () => {
	let testStudent = {};
	let testTeacher = {};
	let testTeacherDisabled = {};
	let testTeacherEnabled = {};
	let teacherFromDifferentSchool;
	let params;
	const schoolId = new ObjectId().toString();

	it('register services and create test users', async () => {
		testStudent = await testObjects.createTestUser({
			roles: ['student'],
			discoverable: false,
			schoolId,
			firstName: 'student',
		});
		testTeacher = await testObjects.createTestUser({
			roles: ['teacher'],
			// discoverable: undefined, // visibility depends on opt-in/opt-ut
			schoolId,
			firstName: 'teacher-default',
		});
		testTeacherDisabled = await testObjects.createTestUser({
			roles: ['teacher'],
			discoverable: false,
			schoolId,
			firstName: 'teacher-disabled',
		});
		testTeacherEnabled = await testObjects.createTestUser({
			roles: ['teacher'],
			discoverable: true,
			schoolId,
			firstName: 'teacher-enabled',
		});
		assert.ok(userService);
		assert.ok(publicTeachersService);
		teacherFromDifferentSchool = await testObjects.createTestUser({
			schoolId: new ObjectId(),
			roles: ['teacher'],
			firstName: 'teacherFromdifferentSchool',
		});
		params = await testObjects.generateRequestParamsFromUser(teacherFromDifferentSchool);
	});

	describe('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION', () => {
		// save TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION value
		// eslint-disable-next-line max-len
		const ORIGINAL_TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION = app.Config.get('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION');
		let result;

		it('set to opt-in: find 1 discoverable teacher (testTeacherEnabled) but not find other teachers', async () => {
			app.Config.set('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION', 'opt-in');
			expect(app.Config.get('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION')).to.be.equal('opt-in');
			result = await publicTeachersService.find({ query: { schoolId }, ...params });
			expect(result.total).to.equal(1);
			expect(result.data[0]._id.toString()).to.equal(testTeacherEnabled._id.toString());
			expect(result.data[0]._id.toString()).to.not.equal(testStudent._id.toString());
			expect(result.data[0]._id.toString()).to.not.equal(testTeacher._id.toString());
		});

		it('set to opt-out: find discoverable teachers but not find the disabled teacher', async () => {
			app.Config.set('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION', 'opt-out');
			expect(app.Config.get('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION')).to.be.equal('opt-out');
			result = await publicTeachersService.find({ query: { schoolId }, ...params });
			const resultIds = result.data.map((teacher) => teacher._id.toString());
			expect(resultIds).to.include(testTeacher._id.toString());
			expect(resultIds).to.include(testTeacherEnabled._id.toString());
			expect(resultIds).to.not.include(testTeacherDisabled._id.toString());
		});

		it('set to enabled: find all 2 teachers, ignoring their setting', async () => {
			// test with enabled'
			app.Config.set('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION', 'enabled');
			expect(app.Config.get('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION')).to.be.equal('enabled');
			result = await publicTeachersService.find({ query: { schoolId }, ...params });
			expect(result.total).to.equal(3);
			const resultIds = result.data.map((teacher) => teacher._id.toString());
			expect(resultIds).to.include(testTeacher._id.toString());
			expect(resultIds).to.include(testTeacherEnabled._id.toString());
			expect(resultIds).to.include(testTeacherDisabled._id.toString());
			expect(resultIds).to.not.include(testStudent._id.toString());
		});

		it('set to disabled: find no teachers (from different school), ignoring their setting', async () => {
			app.Config.set('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION', 'disabled');
			expect(app.Config.get('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION')).to.be.equal('disabled');
			expect(() => publicTeachersService.find({ query: { schoolId }, ...params })).to.throw;
			result = await publicTeachersService.find({
				query: { schoolId: teacherFromDifferentSchool.schoolId },
				...params,
			});
			expect(result.total).to.equal(1);
		});
		// reset TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION back to original value
		// eslint-disable-next-line max-len
		app.Config.set('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION', ORIGINAL_TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION);
	});

	after(async () => {
		await testObjects.cleanup();
	});
});
