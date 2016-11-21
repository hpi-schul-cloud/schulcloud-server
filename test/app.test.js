'use strict';

const assert = require('assert');
const app = require('../src/app');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const logger = require('winston');

describe('Feathers application tests', function () {
	before(function (done) {
		this.server = app.listen(3031);
		logger.level = 'error';
		this.server.once('listening', () => done());
	});

	after(function (done) {
		this.server.close(done);
	});

	it('starts and shows the index page', function () {
		return new Promise((resolve, reject) => {
			chai.request(app)
				.get('/')
				.end((err, res) => {
					assert.equal(res.statusCode, 200);
					resolve();
				});
		});
	});

	describe('404', function () {
		it('shows a 404 page', function () {
			return new Promise((resolve, reject) => {
				chai.request(app)
					.get('/path/to/nowhere')
					.set('content-type', 'text/html')
					.end((err, res) => {
						assert.equal(res.statusCode, 404);
						resolve();
					});
			});
		});

		it('shows a 404 JSON error without stack trace', function () {
			return new Promise((resolve, reject) => {
				chai.request(app)
					.get('/path/to/nowhere')
					.set('content-type', 'application/json')
					.end((err, res) => {
						assert.equal(res.statusCode, 404);
						assert.equal(res.body.code, 404);
						assert.equal(res.body.message, 'Page not found');
						assert.equal(res.body.name, 'NotFound');
						resolve();
					});
			});
		});

		it('serves swagger api docs', function () {
			return new Promise((resolve, reject) => {
				chai.request(app)
					.get('/docs')
					.end((err, res) => {
						assert.equal(res.statusCode, 200);
						expect(res.body.info.description).to.contain('Schul-Cloud');
						resolve();
					});
			});
		});
	});
});
