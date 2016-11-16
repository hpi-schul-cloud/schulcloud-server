const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = require('assert');
const app = require('../../../src/app');
const express = require('express');
const moodleMockServer = require('./moodle/moodleMockServer');
const crypto = require('bcryptjs');
const testObjects = require('./testObjects')(app);



const jwt = require('jsonwebtoken');
const logger = app.logger;

chai.use(chaiHttp);
var should = chai.should();
const expect = chai.expect;

describe('General login service', function () {

	const existingTestAccount = {username: "testMoodleLoginExisting", password: "testPasswordExisting"};
	const nonUniqueAccountA = {username: "poweruser@mail.schul.tech", password: "passwordA"};
	const nonUniqueAccountB = {username: nonUniqueAccountA.username, password: "passwordB"};

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

	let testSystem = null;

	before(function() {
		return Promise.all([
				testObjects.createTestSystem('http://moodle.company.xyz'),
				testObjects.createTestSystem('http://moodle.school.abc'),
				testObjects.createTestUser()])
			.then(([system, otherSystem, testPowerUser]) => {
				testSystem = system;
				return Promise.all([
					testObjects.createTestAccount(nonUniqueTestAccountA, system, testPowerUser),
					testObjects.createTestAccount(nonUniqueTestAccountB, otherSystem, testPowerUser)]);
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
					username: nonUniqueTestAccountA.username,
					password: nonUniqueTestAccountA.password
				})
				.end((err, res) => {
					const httpBadRequest = 400;
					res.res.statusCode.should.equal(httpBadRequest);
					expect(res.body.message).to.contain('systemId');
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
