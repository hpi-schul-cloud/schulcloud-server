const chai = require('chai');
const chaiHttp = require('chai-http');
const appPromise = require('../../src/app');

const { expect } = chai;

chai.use(chaiHttp);

describe('Prometheus metrics', () => {
	let app;
	let server;

	before(async function setup() {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(function cleanup(done) {
		server.close(done);
	});

	describe('prometheus metrics enabled', () => {
		it('/metrics route available', async () => {
			const response = await chai.request(app).get('/metrics');
			expect(response.status).to.equal(200);
			expect(response.text).to.contain('http_request_duration_seconds');
		});
		it("metrics updated by requests and id's are replaced", async () => {
			const { body } = await chai.request(app).get('/schools');
			// request some urls having an id within their path
			await Promise.all(body.data.map((school) => chai.request(app).get(`/schools/${school.id}`)));

			const response = await chai.request(app).get('/metrics');
			expect(response.text, 'contains schools in path').to.contain('/schools');
			expect(response.text, "contains uuid's in path replaced by __id__").to.contain('__id__');
		});
		it('contains nodejs and process metrics', async () => {
			// requires to be executed in order
			const response = await chai.request(app).get('/metrics');
			expect(response.text, 'has eventloop information').to.contain('nodejs_eventloop_lag_seconds');
			expect(response.text, 'has node js version info').to.contain('nodejs_version_info');
		});
	});
});
