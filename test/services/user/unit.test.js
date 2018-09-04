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
		const prepareUser = function(userObject) {
			return registrationPinService.create({"email": userObject.email})
				.then(registrationPin => {
					return registrationPinService.find({
						query: { "pin": registrationPin.pin, "email": registrationPin.email, verified: false }
					});
				}).then(_ => {
					return userService.create(userObject);
				});
		};

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
			.then(test_subrole => prepareUser({
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
