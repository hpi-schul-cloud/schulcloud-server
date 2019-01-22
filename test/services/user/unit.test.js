'use strict';

const assert = require('assert');
const mongoose = require('mongoose');
const app = require('../../../src/app');
const userService = app.service('users');
const registrationPinService = app.service('registrationPins');
const chai = require('chai');
const loginHelper = require('../helpers/login');
const testObjects = require('../helpers/testObjects')(app);
const promisify = require('es6-promisify');
const expect = chai.expect;

describe('user service', function () {
	it('registered the users service', () => {
		assert.ok(userService);
	});

	it('rejects on group patching', function() {
		return userService.patch(null, {email: 'test'}).catch(err => {
			chai.expect(err).to.be.not.undefined;
			chai.expect(err.message).to.equal('Operation on this service requires an id!');
		});
	});

	it('resolves permissions correctly', function () {
		function create_test_base() {
			return app.service('roles')
				.create({
					"name": "test_base",
					"roles": [],
					"permissions": [
						"TEST_BASE",
						"TEST_BASE_2"
					]
				});
		}

		function create_test_subrole(test_base) {
			return app.service('roles')
				.create({
					"name": "test_subrole",
					"roles": [test_base._id],
					"permissions": [
						"TEST_SUB"
					]
				});
		}

		return create_test_base()
			.then(test_base => create_test_subrole(test_base))
			.then(test_subrole => testObjects.createTestUser({
				"id": "0000d231816abba584714d01",
				"accounts": [],
				"schoolId": "0000d186816abba584714c5f",
				"email": "user@testusers.net",
				"firstName": "Max",
				"lastName": "Tester",
				"roles": [
					test_subrole._id
				]
			}))
			.then(user => userService.get(user._id))
			.then(user => {
				const array = Array.from(user.permissions);
				chai.expect(array).to.have.lengthOf(3);
				chai.expect(array).to.include("TEST_BASE", "TEST_BASE_2", "TEST_SUB");
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
						reject(new Error('This call should fail because of an already existing user with the same email'));
					})
					.catch((err) => {
						expect(err.message).to.equal('Die E-Mail Adresse ExistinG@aCCount.de ist bereits in Verwendung!');
						resolve();
					});
			});
		});
	});

	after(testObjects.cleanup);
});

describe('registrationPin Service', function() {
	it ('registered the registrationPin Service', () => {
		assert.ok(registrationPinService);
	});

	it ('creates pins correctly', function() {
		return registrationPinService
			.create({"email": "test.adresse@schul-cloud.org"})
				.then(pinObject => registrationPinService.find({query: {"email": "test.adresse@schul-cloud.org"}}))
				.then(pinObjects => {
					chai.expect(pinObjects.data[0]).to.have.property('pin');
				});
	});

	it ('overwrites old pins', function() {
		return registrationPinService.create({"email": "test.adresse@schul-cloud.org"})
				.then(pinObject => registrationPinService.create({"email": "test.adresse@schul-cloud.org"}))
				.then(pinObject => registrationPinService.find({query: {"email": "test.adresse@schul-cloud.org"}}))
				.then(pinObjects => {
					chai.expect(pinObjects.data).to.have.lengthOf(1);
				});
	});
});
