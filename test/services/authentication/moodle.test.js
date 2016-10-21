'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = require('assert');
const app = require('../../../src/app');
const express = require('express');
const service = app.service('accounts');
const logger = app.logger;

chai.use(chaiHttp);
var should = chai.should();

describe('Moodle single-sign-on', function () {
	let mockMoodle;
	let server;
	const username = 'username';
	const password = 'password';
	const service = 'moodle_mobile_app';    // this is a service that's commonly enabled on Moodle installations
	const responseToken = '4e897dc3beefe6bc340738fe9e40133b';
	const moodlePort = 3001;
	const appPort = 3030;
	before((done) => {
		server = app.listen(appPort);
		server.once('listening', () => {
			mockMoodle = express();
			mockMoodle.post('/login/token.php', (req, res) => {
				if (req.params.username == username
					&& req.params.password == password
					&& req.params.service == service) {
					res.write({token: responseToken}.stringify());
				} else {
					res.write(`{"error": "Invalid login, please try again"}`);
				}
			});
			mockMoodle.listen(moodlePort, () => {
				done();
			});
		});
	});

	after(function(done) {
		server.close(function() {});
		done();
	});

	it('should register the authentication service', () => {
		assert.ok(service);
	});

	it('should create an account for a new user who logs in with moodle', function (done) {
		const options = {
			username: username,
			password: password,
			baseUrl: `http://localhost:${moodlePort}`
		};
		chai.request(app)
			.post('/authentication/moodle')
			.set('Accept', 'application/json')
			//send credentials
			.send({
				'username': username,
				'password': password
			})
			.end((err, res) => {
				res.body.should.have.property('token');
				res.body.token.should.equal(responseToken);
				done();
			});
	});
});
