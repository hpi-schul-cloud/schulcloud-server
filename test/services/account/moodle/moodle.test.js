'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = require('assert');
const app = require('../../../../src/app');
const express = require('express');
const promisify = require("es6-promisify");
const freeport = promisify(require('freeport'));
const moodleMockServer = require('./moodleMockServer');

const testObjects = require('../../helpers/testObjects')(app);

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
		password: existingTestAccount.password,
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
					testObjects.createTestSystem({url: moodle.url}),
					testObjects.createTestUser()]);
			})
			.then(([system, testUser]) => {
				testSystem = system;
				return testObjects.createTestAccount(existingTestAccountParameters, system, testUser);
			});
	});

	it('should create an account for a new user who logs in with moodle', function () {
		return new Promise((resolve, reject) => {
			chai.request(app)
				.post('/accounts')
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

					const account = res.body;
					account.should.have.property('_id');

					account.username.should.equal(newTestAccount.username.toLowerCase());
					account.should.have.property('token');
					account.token.should.equal(mockMoodle.responseToken);

					resolve();
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
