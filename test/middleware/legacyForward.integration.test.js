const chai = require('chai');
const { default: chaiAsPromised } = require('chai-as-promised');
const { default: chaiHttp, request } = require('chai-http');
const proxyquire = require('proxyquire');

const { expect } = chai;
chai.use(chaiHttp);
chai.use(chaiAsPromised);

class MockService {
	find() {
		return Promise.resolve(true);
	}

	setup(app) {
		this.app = app;
	}
}

const registerMockServices = function initializeServices() {
	const app = this;
	app.use('service/without/basepath', new MockService());
	app.use('legacy/v1/service/with/basepath', new MockService());
};

describe('legacy forward', () => {
	// delete require.cache[require.resolve('../../src/app')];

	let app;
	let server;

	before(async () => {
		const appPromise = proxyquire('../../src/app', { './services': registerMockServices });
		// eslint-disable-next-line global-require
		app = await appPromise();

		server = await app.listen(0);
		return server;
	});

	after(async () => {
		await server.close();
	});

	it('when a non-existing route is called, then the server responds with 404', async () => {
		const req = request.execute(app).get('/this/route/does/not/exist');
		const result = await req.send();
		expect(result.body.code).to.equal(404);
	});

	it('when a service without basepath is called, then the server respons with 200', async () => {
		const req = request.execute(app).get('/service/without/basepath');
		const result = await req.send();
		expect(result.status).to.equal(200);
	});

	it('when a service with basepath is called without a basepath, then the call is forwarded and succeeds', async () => {
		const req = request.execute(app).get('/service/with/basepath');
		const result = await req.send();
		expect(result.status).to.equal(200);
	});

	it('when a service with basepath is called with a basepath, the call succeeds', async () => {
		const req = request.execute(app).get('/legacy/v1/service/with/basepath');
		const result = await req.send();
		expect(result.status).to.equal(200);
	});
});
