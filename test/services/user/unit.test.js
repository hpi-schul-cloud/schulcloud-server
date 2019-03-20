/* eslint-disable no-unused-expressions */


const assert = require('assert');
const mongoose = require('mongoose');
const promisify = require('es6-promisify');
const chai = require('chai');
const app = require('../../../src/app');
const loginHelper = require('../helpers/login');
const testObjects = require('../helpers/testObjects')(app);

const userService = app.service('users');
const registrationPinService = app.service('registrationPins');
const classesService = app.service('classes');
const coursesService = app.service('courses');

const expect = chai.expect;

let testUserId;

describe('user service', () => {
	it('registered the users service', () => {
		assert.ok(userService);
		assert.ok(classesService);
		assert.ok(coursesService);
	});

	it('rejects on group patching', () => userService.patch(null, { email: 'test' }).catch((err) => {
		chai.expect(err).to.be.not.undefined;
		chai.expect(err.message).to.equal('Operation on this service requires an id!');
	}));

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
			}))
			.then(user => userService.get(user._id))
			.then((user) => {
				testUserId = user._id;
				chai.expect(user.avatarInitials).to.eq('MT');
				const array = Array.from(user.permissions);
				chai.expect(array).to.have.lengthOf(3);
				chai.expect(array).to.include('TEST_BASE', 'TEST_BASE_2', 'TEST_SUB');
			});
	});

	it('deletes user correctly', () => {
		let classId;
		let courseId;

		classesService.find({ query: { name: 'Demo-Klasse', $limit: 1 } })
			.then((classes) => {
				classes.data.forEach((myClass) => {
					myClass.userIds.push(testUserId);
					classId = myClass._id;
				});
				chai.expect(classId).to.not.be.undefined;

				coursesService.find({ query: { name: 'Mathe', $limit: 1 } })
					.then((courses) => {
						courses.data.forEach((course) => {
							course.userIds.push(testUserId);
							courseId = course._id;
						});
						chai.expect(courseId).to.not.be.undefined;

						return userService.remove(testUserId).then((h) => {
							classesService.get(classId)
								.then(myClass => chai.expect(myClass.userIds).to.not.include(testUserId));
							coursesService.get(courseId)
								.then(course => chai.expect(course.userIds).to.not.include(testUserId));
						});
					});
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
						reject(new Error(
							'This call should fail because of an already existing user with the same email',
						));
					})
					.catch((err) => {
						expect(err.message).to.equal(
							'Die E-Mail Adresse ExistinG@aCCount.de ist bereits in Verwendung!',
						);
						resolve();
					});
			});
		});
	});

	after(testObjects.cleanup);
});

describe('registrationPin Service', () => {
	it('registered the registrationPin Service', () => {
		assert.ok(registrationPinService);
	});

	it('creates pins correctly', () => registrationPinService
		.create({ email: 'test.adresse@schul-cloud.org' })
		.then(pinObject => registrationPinService.find({ query: { email: 'test.adresse@schul-cloud.org' } }))
		.then((pinObjects) => {
			chai.expect(pinObjects.data[0]).to.have.property('pin');
		}));

	it('overwrites old pins', () => registrationPinService.create({ email: 'test.adresse@schul-cloud.org' })
		.then(pinObject => registrationPinService.create({ email: 'test.adresse@schul-cloud.org' }))
		.then(pinObject => registrationPinService.find({ query: { email: 'test.adresse@schul-cloud.org' } }))
		.then((pinObjects) => {
			chai.expect(pinObjects.data).to.have.lengthOf(1);
		}));
});
