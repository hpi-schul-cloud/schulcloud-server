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
