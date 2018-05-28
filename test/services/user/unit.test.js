'use strict';

const assert = require('assert');
const mongoose = require('mongoose');
const app = require('../../../src/app');
const userService = app.service('users');
const classService = app.service('classes');
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

	it('resolves classnames on creation', function () {
		let studentIds = [];

		function create_students() {
			return Promise.all([
				userService.create({
					"firstName": "Max",
					"lastName": "Mustermann",
					"email": "max" + Date.now() + "@test.de",
					"schoolId": '584ad186816abba584714c94',
					"className": "testClass3a"
				})
				.then(user=>{
					studentIds.push(user._id);
				}),
				userService.create({
					"firstName": "Moritz",
					"lastName": "Mustermann",
					"email": "moritz" + Date.now() + "@test.de",
					"schoolId": '584ad186816abba584714c94',
					"className": "testClass3a"
				})
				.then(user=>{
					studentIds.push(user._id);
				})
			]);
		}

		return create_students()
			.then(result => {
				return new Promise((resolve, reject)=>{
					setTimeout(function(){ //todo: avoid timeout
						classService.find({query: {name: "testClass3a"}})
						.then(result => {
							resolve(result);
						}); 
					}, 500);
					//should it fail, try adjusting the timeout.
				});
			})
			.then(result => {
				chai.expect(result.total).to.equal(1);
				chai.expect(result.data[0].userIds).to.include(studentIds[0], studentIds[1]);
			});
	});

	after(testObjects.cleanup);
});

