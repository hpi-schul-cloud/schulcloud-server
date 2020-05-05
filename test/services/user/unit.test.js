const assert = require('assert');
const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;

const { Configuration } = require('@schul-cloud/commons');
const app = require('../../../src/app');

const userService = app.service('users');
const registrationPinService = app.service('registrationPins');
const { registrationPinModel } = require('../../../src/services/user/model');

const publicTeachersService = app.service('publicTeachers');
const classesService = app.service('classes');
const coursesService = app.service('courses');
const testObjects = require('../helpers/testObjects')(app);
const { equal: equalIds } = require('../../../src/helper/compare').ObjectId;

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

	it('student can edit himself', async () => {
		const student = await testObjects.createTestUser({ roles: ['student'] });
		const params = await testObjects.generateRequestParamsFromUser(student);
		params.query = {};
		const result = await app.service('users').patch(student._id, { firstName: 'Bruce' }, params);
		expect(result).to.not.be.undefined;
		expect(result.firstName).to.equal('Bruce');
	});

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

	it('student can read other student', async () => {
		const student = await testObjects.createTestUser({ roles: ['student'] });
		const otherStudent = await testObjects.createTestUser({ role: ['student'], birthday: Date.now() });
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
		const student = await testObjects.createTestUser({ role: ['student'], birthday: Date.now() });
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

	it('does not allow students and teachers to find parents', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const student = await testObjects.createTestUser({ roles: ['student'] });
		const parent = await testObjects.createTestUser({ role: ['parent'] });

		const teacherParams = await testObjects.generateRequestParamsFromUser(teacher);
		teacherParams.query = {};
		const result = await app.service('users').find(teacherParams);
		expect(result.data.some((r) => equalIds(r._id, parent._id))).to.be.false;

		const studentParams = await testObjects.generateRequestParamsFromUser(student);
		studentParams.query = {};
		const studentResults = await app.service('users').find(studentParams);
		expect(studentResults.data.some((r) => equalIds(r._id, parent._id))).to.be.false;
	});

	it('allows access to parents by superheroes', async () => {
		const hero = await testObjects.createTestUser({ roles: ['superhero'] });
		const parent = await testObjects.createTestUser({ role: ['parent'] });

		const params = await testObjects.generateRequestParamsFromUser(hero);
		params.query = {};
		const result = await app.service('users').find(params);
		expect(result.data.some((r) => equalIds(r._id, parent._id))).to.be.true;
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
	let pin = null;
	const email = 'test.adresse@schul-cloud.org';
	it('registered the registrationPin Service', () => {
		assert.ok(registrationPinService);
	});

	it('creates pins correctly', () => registrationPinService
		.create({ email, silent: true })
		.then(async () => {
			({ pin } = (await registrationPinModel.findOne({ email }).exec()));
		})
		.then(() => registrationPinService.find({ query: { email, pin } }))
		.then((pinObjects) => expect(pinObjects.data[0]).to.have.property('pin')));

	it('overwrites old pins', () => registrationPinService
		.create({ email, silent: true })
		.then(async () => {
			const newPin = (await registrationPinModel.findOne({ email }).exec()).pin;
			expect(newPin).to.be.ok;
			expect(pin).to.be.not.equal(newPin);
			pin = newPin;
		})
		.then(() => registrationPinService.create({ email, silent: true }))
		.then(async () => {
			const newPin = (await registrationPinModel.findOne({ email }).exec()).pin;
			expect(newPin).to.be.ok;
			expect(pin).to.be.not.equal(newPin);
			pin = newPin;
		})
		.then(() => registrationPinService.find({ query: { email, pin } }))
		.then((pinObjects) => expect(pinObjects.data).to.have.lengthOf(1)));

	it('find without pin fails', () => registrationPinService
		.create({ email, silent: true })
		.then(() => registrationPinService.create({ email, silent: true }))
		.then(() => registrationPinService.find({ query: { email } }))
		.then(() => { throw new Error('pin should be given'); })
		.catch((err) => expect(err.message.length).to.be.greaterThan(5)));
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
		const ORIGINAL_TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION = Configuration.get('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION');
		let result;

		it('set to opt-in: find 1 discoverable teacher (testTeacherEnabled) but not find other teachers', async () => {
			Configuration.set('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION', 'opt-in');
			expect(Configuration.get('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION')).to.be.equal('opt-in');
			result = await publicTeachersService.find({ query: { schoolId }, ...params });
			expect(result.total).to.equal(1);
			expect(result.data[0]._id.toString()).to.equal(testTeacherEnabled._id.toString());
			expect(result.data[0]._id.toString()).to.not.equal(testStudent._id.toString());
			expect(result.data[0]._id.toString()).to.not.equal(testTeacher._id.toString());
		});

		it('set to opt-out: find discoverable teachers but not find the disabled teacher', async () => {
			Configuration.set('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION', 'opt-out');
			expect(Configuration.get('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION')).to.be.equal('opt-out');
			result = await publicTeachersService.find({ query: { schoolId }, ...params });
			const resultIds = result.data.map((teacher) => teacher._id.toString());
			expect(resultIds).to.include(testTeacher._id.toString());
			expect(resultIds).to.include(testTeacherEnabled._id.toString());
			expect(resultIds).to.not.include(testTeacherDisabled._id.toString());
		});

		it('set to enabled: find all 2 teachers, ignoring their setting', async () => {
			// test with enabled'
			Configuration.set('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION', 'enabled');
			expect(Configuration.get('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION')).to.be.equal('enabled');
			result = await publicTeachersService.find({ query: { schoolId }, ...params });
			expect(result.total).to.equal(3);
			const resultIds = result.data.map((teacher) => teacher._id.toString());
			expect(resultIds).to.include(testTeacher._id.toString());
			expect(resultIds).to.include(testTeacherEnabled._id.toString());
			expect(resultIds).to.include(testTeacherDisabled._id.toString());
			expect(resultIds).to.not.include(testStudent._id.toString());
		});

		it('set to disabled: find no teachers (from different school), ignoring their setting', async () => {
			Configuration.set('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION', 'disabled');
			expect(Configuration.get('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION')).to.be.equal('disabled');
			expect(() => publicTeachersService.find({ query: { schoolId }, ...params })).to.throw;
			result = await publicTeachersService.find({
				query: { schoolId: teacherFromDifferentSchool.schoolId },
				...params,
			});
			expect(result.total).to.equal(1);
		});
		// reset TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION back to original value
		// eslint-disable-next-line max-len
		Configuration.set('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION', ORIGINAL_TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION);
	});

	after(async () => {
		await testObjects.cleanup();
	});
});
