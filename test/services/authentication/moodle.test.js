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
const jwt = require('jsonwebtoken');
const logger = app.logger;

chai.use(chaiHttp);
var should = chai.should();

describe('Moodle single-sign-on', function () {
	let mockMoodle;
	let server;

	let createdUserIds = [];

	const newTestAccount = {username: "testMoodleLoginUser", password: "testPassword"};
	const existingTestAccount = {username: "testMoodleLoginExisting", password: "testPasswordExisting"};
	const moodleService = 'moodle_mobile_app';    // this is a service that's commonly enabled on Moodle installations
	const responseToken = '4e897dc3beefe6bc340738fe9e40133b';

	before(done => {
		this.timeout(10000);
		const appPromise = freeport()
			.then((port) => {
				return new Promise((accept, reject) => {
					server = app.listen(port);
					server.once('listening', accept);
				});
			});

		const moodlePromise = moodleMockServer({
			acceptUsers: [newTestAccount, existingTestAccount]
		});

		function createTestAccount(moodlePromise) {
			return moodlePromise.then(moodle => {
				const existingAccount = {
					email: existingTestAccount.username,
					password: crypto.hashSync(existingTestAccount.password),
					//userId: null,
					token: "oldToken",
					//reference: {type: String /*, required: true*/},
					//school: {type: Schema.Types.ObjectId /*, required: true*/},
					system: `http://localhost:${moodle.port}`
				};
				return accountService.basicCreate(existingAccount);
			}).then(account => {
				createdUserIds.push(account._id);
				return Promise.resolve(account);
			});
		}

		Promise.all([appPromise, moodlePromise, createTestAccount(moodlePromise)])
			.then(([_, moodle]) => {
				mockMoodle = moodle;
				done();
			});
	});

	it('should register the moodle authentication service', () => {
		assert.ok(app.service('/auth/moodle'));
	});

	it('should create an account for a new user who logs in with moodle', function () {
		return new Promise((resolve, reject) => {

			chai.request(app)
				.post('/auth/moodle')
				.set('Accept', 'application/json')
				.set('content-type', 'application/x-www-form-urlencoded')
				//send credentials
				.send({
					username: newTestAccount.username,
					password: newTestAccount.password,
					wwwroot: `http://localhost:${mockMoodle.port}`
				})
				.end((err, res) => {
					if (err) {
						reject(err);
						return;
					}
					const decodedToken = jwt.decode(res.body, {json: true});
					// get the account id from JWT
					decodedToken.should.have.property('id');
					createdUserIds.push(decodedToken.id);
					accountService.get(decodedToken.id)
						.then((createdAccount) => {
							createdAccount.email.should.equal(newTestAccount.username);
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
				.post('/auth/moodle')
				.set('Accept', 'application/json')
				.set('content-type', 'application/x-www-form-urlencoded')
				//send credentials
				.send({
					username: existingTestAccount.username,
					password: existingTestAccount.password,
					wwwroot: `http://localhost:${mockMoodle.port}`
				})
				.end((err, res) => {
					if (err) {
						reject(err);
						return;
					}
					const decodedToken = jwt.decode(res.body, {json: true});
					decodedToken.should.have.property('id');
					accountService.get(decodedToken.id).then(fetchedAccount => {
							fetchedAccount.token.should.equal(responseToken);
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
				.post('/auth/moodle')
				.set('Accept', 'application/json')
				.set('content-type', 'application/x-www-form-urlencoded')
				//send credentials
				.send({
					username: existingTestAccount.username,
					wwwroot: `http://localhost:${mockMoodle.port}`
				})
				.end((err, res) => {
					//res.res.statusCode.should.not.equal(200); // TODO more appropriate:
					res.res.statusCode.should.equal(401);
					resolve();
				});
		});
	});

	after(function(done) {
		server.close(function() {});
		const deletions = createdUserIds.map(id => {
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
