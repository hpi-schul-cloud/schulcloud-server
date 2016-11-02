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


const accountService = app.service('accounts');
const systemService = app.service('systems');
const userService = app.service('users');

const jwt = require('jsonwebtoken');
const logger = app.logger;

chai.use(chaiHttp);
var should = chai.should();
const expect = chai.expect;

describe('Moodle single-sign-on', function () {

	let createdAccountIds = [];
	let createdUserIds = [];
	let mockMoodle = null;

	const newTestAccount = {username: "testMoodleLoginUser", password: "testPassword"};
	const existingTestAccount = {username: "testMoodleLoginExisting", password: "testPasswordExisting"};
	const nonUniqueAccountA = {username: "poweruser@mail.schul.tech", password: "passwordA"};
	const nonUniqueAccountB = {username: nonUniqueAccountA.username, password: "passwordB"};

	const existingTestAccountParameters = {
		username: existingTestAccount.username,
		password: crypto.hashSync(existingTestAccount.password),
		//userId: null,
		token: "oldToken",
		//reference: {type: String /*, required: true*/},
		//schoolId: {type: Schema.Types.ObjectId /*, required: true*/},
	};

	const nonUniqueTestAccountA = {
		username: nonUniqueAccountA.username,
		password: crypto.hashSync(nonUniqueAccountA.password),
		//userId: null,
		token: "abcdef012345"
		//reference: {type: String /*, required: true*/},
		//schoolId: {type: Schema.Types.ObjectId /*, required: true*/},
	};

	const nonUniqueTestAccountB = {
		username: nonUniqueAccountB.username,
		password: crypto.hashSync(nonUniqueAccountB.password),
		//userId: null,
		token: "abcdef012345",
		//reference: {type: String /*, required: true*/},
		//schoolId: {type: Schema.Types.ObjectId /*, required: true*/},
		system: `http://moodle.company.xyz`
	};

	function createApp() {
		return freeport()
			.then(port => {
				return new Promise((accept) => {
					const server = app.listen(port);
					server.once('listening', accept);
				});
			});
	}

	function createMoodleTestServer() {
		return moodleMockServer({
			acceptUsers: [newTestAccount, existingTestAccount, nonUniqueAccountA]
		});
	}

	let testSystem = null;
	function createTestSystem(moodle) {
		const localMoodleWebroot = `http://localhost:${moodle.port}`;
		return systemService.create({url: localMoodleWebroot, type: 'moodle'})
			.then(system => {
				testSystem = system;
				return Promise.resolve(system);
			});
	}

	function createOtherTestSystem() {
		return systemService.create({url: `http://moodle.company.xyz`, type: 'moodle'});
	}

	function createTestUser() {
		return userService.create({});
	}

	function createTestAccount(accountParameters, system, user) {
		accountParameters.systemId = system.id;
		accountParameters.userId = user._id;
		return accountService.create(accountParameters)
			.then(account => {
				createdAccountIds.push(account._id);
				return Promise.resolve(account);
			});
	}

	before(done => {

		let systems = null;
		createMoodleTestServer()
			.then(moodle => {
				mockMoodle = moodle;
				return Promise.all([
					createTestSystem(moodle),
					createOtherTestSystem(),
					createTestUser(),
					createTestUser()]);
			})
			.then(([system, otherSystem, testUser, testPowerUser]) => {
				return Promise.all([
					createTestAccount(existingTestAccountParameters, system, testUser),
					createTestAccount(nonUniqueTestAccountA, system, testPowerUser),
					createTestAccount(nonUniqueTestAccountB, otherSystem, testPowerUser)]);
			})
			.then((result, error) => {
				done(error);
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
					createdUserIds.push(decodedToken._id);

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

	it('should return an error if no password is set', () => {
		return new Promise((resolve, reject) => {
			chai.request(app)
				.post('/auth')
				.set('Accept', 'application/json')
				.set('content-type', 'application/x-www-form-urlencoded')
				//send credentials
				.send({
					username: existingTestAccount.username,
					systemId: testSystem.id
				})
				.end((err, res) => {
					res.res.statusCode.should.equal(401);
					expect(res.body.message).to.contain('password');
					resolve();
				});
		});
	});

	it('should throw an error if there are two accounts per email, but no systemId is specified', () => {
		return new Promise((resolve) => {
			chai.request(app)
				.post('/auth')
				.set('Accept', 'application/json')
				.set('content-type', 'application/x-www-form-urlencoded')
				//send credentials
				.send({
					username: nonUniqueTestAccountA.email,
					password: nonUniqueTestAccountA.password
				})
				.end((err, res) => {
					const httpBadRequest = 400;
					res.res.statusCode.should.equal(httpBadRequest);
					expect(res.body.message).to.contain('username');
					resolve();
				});
		});
	});

	after(function (done) {
		const deletions = createdAccountIds.map(id => {
			return accountService.remove(id);
		});
		Promise.all(deletions)
			.then(() => {
				done();
			})
			.catch((error) => {
				logger.error('Could not remove test account(s): ' + error);
				done();
			});
	});
});
