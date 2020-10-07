const assert = require('assert');
const chai = require('chai');

const { expect } = chai;
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const appPromise = require('../src/app');

describe('Feathers application tests', () => {
	let app;
	let server;

	before(async function setup() {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(function cleanup(done) {
		server.close(done);
	});

	it('starts and shows the index page', () =>
		new Promise((resolve) => {
			chai
				.request(app)
				.get('/')
				.end((err, res) => {
					assert.equal(res.statusCode, 200);
					resolve();
				});
		}));

	describe('404', () => {
		it('shows a 404 page', () =>
			new Promise((resolve) => {
				chai
					.request(app)
					.get('/path/to/nowhere')
					.set('content-type', 'text/html')
					.end((err, res) => {
						assert.equal(res.statusCode, 404);
						resolve();
					});
			}));

		it('shows a 404 JSON error without stack trace', () =>
			new Promise((resolve) => {
				chai
					.request(app)
					.get('/path/to/nowhere')
					.set('content-type', 'application/json')
					.end((err, res) => {
						assert.equal(res.statusCode, 404);
						assert.equal(res.body.code, 404);
						assert.equal(res.body.message, 'Page not found');
						assert.equal(res.body.name, 'NotFound');
						resolve();
					});
			}));

		it('serves swagger api docs', () =>
			new Promise((resolve) => {
				chai
					.request(app)
					.get('/docs')
					.end((err, res) => {
						assert.equal(res.statusCode, 200);
						expect(res.text).to.exist;
						resolve();
					});
			}));
	});
});
