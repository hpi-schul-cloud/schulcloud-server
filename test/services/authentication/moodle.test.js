'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = require('assert');
const app = require('../../../src/app');
const express = require('express');
const bodyParser = require('body-parser');
const freeport = require('freeport');
const promisify = require("es6-promisify");

const accountService = app.service('accounts');
const jwt = require('jsonwebtoken');
const logger = app.logger;

chai.use(chaiHttp);
var should = chai.should();

describe('Moodle single-sign-on', function () {
	let mockMoodle;
	let moodlePort;
	let server;
	const username = 'username';
	const password = 'password';
	const moodleService = 'moodle_mobile_app';    // this is a service that's commonly enabled on Moodle installations
	const responseToken = '4e897dc3beefe6bc340738fe9e40133b';

	before((done) => {
		const appPromise = promisify(freeport)()
			.then((port) => {
				return new Promise((accept, reject) => {
					server = app.listen(port);
					server.once('listening', accept);
				});
			});

		const moodlePromise = promisify(freeport)()
			.then((port) => {
				moodlePort = port;
				return new Promise((accept, reject) => {
					mockMoodle = express();
					mockMoodle.use(bodyParser.json()); // for parsing application/json
					mockMoodle.use(bodyParser.urlencoded({extended: true})); // support encoded bodies
					mockMoodle.post('/login/token.php', (req, res) => {
						if (req.body.username == username
							&& req.body.password == password
							&& req.body.service == moodleService) {
							res.json({token: responseToken});
						} else {
							res.send(`{"error": "Invalid login, please try again"}`);
						}
					});
					mockMoodle.listen(port, accept);
				});
			});
		Promise.all([appPromise, moodlePromise])
			.then(() => { done(); });
	});

		it('should register the moodle authentication service', () => {
			assert.ok(app.service('/auth/moodle'));
		});

	let createdUserId = null;
	it('should create an account for a new user who logs in with moodle', function (done) {
		//this.timeout(5000);
		chai.request(app)
			.post('/auth/moodle')
			.set('Accept', 'application/json')
			.set('content-type', 'application/x-www-form-urlencoded')
			//send credentials
			.send({
				username: username,
				password: password,
				wwwroot: `http://localhost:${moodlePort}`
			})
			.end((err, res, body) => {
				const decodedToken = jwt.decode(res.body, {json: true});
				// get the account id from JWT
				decodedToken.should.have.property('id');
				createdUserId = decodedToken.id;
				//res.body.token.should.equal(responseToken);
				done();
			});
	});

	after(function(done) {
		server.close(function() {});
		accountService.remove(createdUserId).catch((error) => {
			logger.error('Could not remove test account: ' + error);
		});
		done();
	});
});
