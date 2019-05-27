const assert = require('assert');
const { expect } = require('chai');

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
			.then(testBase => createTestSubrole(testBase))
			.then(testSubrole => testObjects.createTestUser({
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
			.then(user => userService.get(user._id))
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
						reject(new Error('This call should fail because of an already existing user with the same email'));
					})
					.catch((err) => {
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
		.then(pinObjects => expect(pinObjects.data[0]).to.have.property('pin')));

	it('overwrites old pins', () => registrationPinService.create({ email: 'test.adresse@schul-cloud.org' })
		.then(() => registrationPinService.create({ email: 'test.adresse@schul-cloud.org' }))
		.then(() => registrationPinService.find({ query: { email: 'test.adresse@schul-cloud.org' } }))
		.then(pinObjects => expect(pinObjects.data).to.have.lengthOf(1)));
});

describe('publicTeachers service', () => {
	let testStudent = {};
	let testTeacherDiscoverable = {};
	let testTeacherNotDiscoverable = {};

	it('register services and create test users', async () => {
		testStudent = await testObjects.createTestUser({
			roles: ['student'],
			discoverable: false,
		});
		testTeacherDiscoverable = await testObjects.createTestUser({
			roles: ['teacher'],
			discoverable: true,
		});
		testTeacherNotDiscoverable = await testObjects.createTestUser({
			roles: ['teacher'],
			discoverable: false,
		});
		assert.ok(userService);
		assert.ok(publicTeachersService);
	});

	it('find 1 discoverable teacher but not find other non-discoverable users', async () => {
		const result = await publicTeachersService.find({ query: { schoolId: testObjects.options.schoolId } });
		if (process.env.SC_FEDERALSTATE !== 'niedersachsen') {
			expect(result.total).to.equal(1);
			expect(result.data[0]._id.toString()).to.equal(testTeacherDiscoverable._id.toString());
			expect(result.data[0]._id.toString()).to.not.equal(testStudent._id.toString());
			expect(result.data[0]._id.toString()).to.not.equal(testTeacherNotDiscoverable._id.toString());
		} else {
			expect(result.total).to.equal(3);
		}
	});

	after(async () => {
		await testObjects.cleanup();
	});
});
