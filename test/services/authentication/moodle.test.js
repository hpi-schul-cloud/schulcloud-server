'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = require('assert');
const app = require('../../../src/app');
const express = require('express');
const promisify = require("es6-promisify");
const freeport = promisify(require('freeport'));
const moodleMockServer = require('./moodleMockServer');
const crypto = require('bcryptjs');

const testObjects = require('./testObjects')(app);

const accountService = app.service('accounts');
const systemService = app.service('systems');
const userService = app.service('users');

const jwt = require('jsonwebtoken');
const logger = app.logger;

chai.use(chaiHttp);
const should = chai.should();

describe('Moodle single-sign-on', function () {

	let mockMoodle = null;
	let testSystem = null;

	const newTestAccount = {username: "testMoodleLoginUser", password: "testPassword"};

	const existingTestAccount = {username: "testMoodleLoginExisting", password: "testPasswordExisting"};
	const existingTestAccountParameters = {
		username: existingTestAccount.username,
		password: crypto.hashSync(existingTestAccount.password),
		token: "oldToken"
	};

	function createMoodleTestServer() {
		return moodleMockServer({
			acceptUsers: [newTestAccount, existingTestAccount]
		});
	}

	before(function () {

		return createMoodleTestServer()
			.then(moodle => {
				mockMoodle = moodle;
				return Promise.all([
					testObjects.createTestSystem(moodle.url),
					testObjects.createTestUser()]);
			})
			.then(([system, testUser]) => {
				testSystem = system;
				return testObjects.createTestAccount(existingTestAccountParameters, system, testUser);
			});
	});

	it('should create a user and an account for a new user who logs in with moodle', function () {
		return new Promise((resolve, reject) => {

			chai.request(app)
				.post('/auth')
				.set('Accept', 'application/json')
				.set('content-type', 'application/x-www-form-urlencoded')
				//send credentials
				.send({
					username: newTestAccount.username,
					password: newTestAccount.password,
					systemId: testSystem.id
				})
				.end((err, res) => {
					if (err) {
						reject(err);
						return;
					}
					const decodedToken = jwt.decode(res.body.token);
					// get the account id from JWT
					decodedToken.should.have.property('_id');
					testObjects.createdUserIds.push(decodedToken._id);

					userService.get(decodedToken._id)
						.then(createdUser => {
							createdUser.accounts.length.should.equal(1);
							let accountId = createdUser.accounts[0];
							return accountService.get(accountId);
						})
						.then((createdAccount) => {
							createdAccount.username.should.equal(newTestAccount.username);
							createdAccount.should.have.property('token');
							createdAccount.token.should.equal(mockMoodle.responseToken);
							resolve();
						})
						.catch(error => {
							logger.error('failed to get the account from the service: ' + error);
							//throw error;
							reject(error);
							//done();
						});

				});
		});
	});

	it('should find an existing account if the user provides correct moodle credentials and update the token in the database', () => {
		return new Promise((resolve, reject) => {
			chai.request(app)
				.post('/auth')
				.set('Accept', 'application/json')
				.set('content-type', 'application/x-www-form-urlencoded')
				//send credentials
				.send({
					username: existingTestAccount.username,
					password: existingTestAccount.password,
					systemId: testSystem.id
				})
				.end((err, res) => {
					if (err) {
						reject(err);
						return;
					}
					const decodedToken = jwt.decode(res.body.token);
					decodedToken.should.have.property('_id');
					userService.get(decodedToken._id)
						.then(user => accountService.get(user.accounts[0]))
						.then(fetchedAccount => {
							fetchedAccount.token.should.equal(mockMoodle.responseToken);
							resolve();
						})
						.catch(error => {
							reject(error);
						});
				});
		});
	});


	after(function (done) {
		testObjects.cleanup()
			.then(() => {
				done();
			})
			.catch((error) => {
				logger.error('Could not remove test account(s): ' + error);
				done();
			});
	});
});
