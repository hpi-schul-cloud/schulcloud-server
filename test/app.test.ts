import assert from 'assert';
import chai from 'chai';
import ChaiHttp from 'chai-http';
import appPromise from '../src/app';

const { expect } = chai;
chai.use(ChaiHttp);

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

	it('starts and shows the index page', async () => {
		const response = await chai.request(app).get('/');
		assert.equal(response.status, 200);
	});

	describe('404', () => {
		it('shows a 404 page', async () => {
			const response = await chai.request(app).get('/path/to/nowhere').set('content-type', 'text/html');
			assert.equal(response.status, 404);
		});

		it('shows a 404 JSON error without stack trace', async () => {
			const res = await chai.request(app).get('/path/to/nowhere').set('content-type', 'application/json');
			assert.equal(res.status, 404);
			assert.equal(res.body.status, 404);
			assert.equal(res.body.detail, 'Page not found.');
			assert.equal(res.body.title, 'PageNotFound');
		});

		it('serves swagger api docs', async () => {
			const res = await chai.request(app).get('/docs');
			assert.equal(res.status, 200);
			expect(res.text).to.exist;
		});
	});
});
