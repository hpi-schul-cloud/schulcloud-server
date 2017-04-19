'use strict';

const assert = require('assert');
const mongoose = require('mongoose');
const app = require('../../../src/app');
const userService = app.service('users');
const chai = require('chai');
const loginHelper = require('../helpers/login');
const testObjects = require('../helpers/testObjects')(app);
const promisify = require('es6-promisify');
const expect = chai.expect;

describe('user service', function () {
	it('registered the users service', () => {
		assert.ok(userService);
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
			.then(test_subrole => userService.create({
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

	it('shows only users who belong to the same school as the requester', () => {
		const testCredentials = {
			username: "testuser@school-of-tests.schul-cloud.org",
			password: "passwordA",
		};

		const otherSchool = {
			id: '000000000000000000000002'
		};
		return Promise.all([
			testObjects.createTestSystem(''),
			testObjects.createTestUser({schoolId: '000000000000000000538001'}),
			testObjects.createTestUser({schoolId: otherSchool.id})
		]).then(([system, requester, otherUser]) => {
			return testObjects.createTestAccount(JSON.parse(JSON.stringify(testCredentials)), system, requester)
				.then(requesterAccount => [requester, otherUser, requesterAccount]);
		}).then(([requester, otherUser, requesterAccount]) => {
			const request = chai.request(app)
					.get('/users')
					.set('Accept', 'application/json')
					.set('content-type', 'application/x-www-form-urlencoded');
			return loginHelper.authenticate(request)(testCredentials)
				.then(response => {
					const data = response.body.data;
					expect(data).to.have.lengthOf(1);

					const schoolIds = data.map(d => d.schoolId);
					expect(schoolIds).to.not.contain(otherSchool.id);
				});
		});

	});

	after(testObjects.cleanup);
});

