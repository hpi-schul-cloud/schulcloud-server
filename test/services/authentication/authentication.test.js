const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = require('assert');
const express = require('express');
const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);
const moodleMockServer = require('../account/moodle/moodleMockServer');

const accountService = app.service('accounts');
const userService = app.service('users');

const jwt = require('jsonwebtoken');

const { logger } = app;

chai.use(chaiHttp);
const should = chai.should();
const { expect } = chai;

describe('General login service', () => {
	const testAccount = {
		username: 'poweruser@mail.schul.tech',
		password: 'passwordA',
		token: 'abcdef012345',
	};

	let testSystem = null;
	let mockMoodle = null;

	function createMoodleTestServer() {
		return moodleMockServer({
			acceptUsers: [testAccount],
		});
	}

	before(() => createMoodleTestServer()
		.then((moodle) => {
			mockMoodle = moodle;
			return Promise.all([
				testObjects.createTestSystem({ url: moodle.url }),
				testObjects.createTestUser()]);
		})
		.then(([system, testUser]) => {
			testSystem = system;
			return testObjects.createTestAccount(Object.assign({}, testAccount), system, testUser);
		}));

	it('should get a JWT which includes accountId and userId', () => new Promise((resolve, reject) => {
		chai.request(app)
			.post('/authentication')
			.set('Accept', 'application/json')
			.set('content-type', 'application/x-www-form-urlencoded')
		// send credentials
			.send({
				username: testAccount.username,
				password: testAccount.password,
			})
			.end((err, res) => {
				if (err) {
					reject(err);
					return;
				}

				const decodedToken = jwt.decode(res.body.accessToken);

				// get the account id from JWT
				decodedToken.should.have.property('accountId');
				testObjects.createdUserIds.push(decodedToken.accountId);

				Promise.all([
					accountService.get(decodedToken.accountId),
					userService.get(decodedToken.userId),
				])
					.then(([account, user]) => {
						account.username.should.equal(testAccount.username);
						account.should.have.property('token');
						account.token.should.equal(mockMoodle.responseToken);
						resolve();
					})
					.catch((error) => {
						logger.error(`failed to get the account from the service: ${error}`);
						// throw error;
						reject(error);
						// done();
					});

				resolve();
			});
	}));

	after((done) => {
		testObjects.cleanup()
			.then(() => {
				done();
			})
			.catch((error) => {
				logger.error(`Could not remove test account(s): ${error}`);
				done();
			});
	});
});
