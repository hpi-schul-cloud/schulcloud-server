import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiHttp from 'chai-http';
import proxyquire from 'proxyquire';
import mockery from 'mockery';

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

describe('legacy forward', function test() {
	this.timeout(30000);
	let app;
	let server;

	before(async () => {
		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true,
		});
		mockery.registerMock('./services', registerMockServices);
		const appPromise = await import('../../src/app');
		app = await appPromise.default;
		server = await app.listen(0);
	});

	after(async () => {
		mockery.deregisterAll();
		mockery.disable();
		await server.close();
	});

	it('when a non-existing route is called, then the server responds with 404', async () => {
		const result = await chai.request(app).get('/this/route/does/not/exist');
		expect(result.body.code).to.equal(404);
	});

	it('when a service without basepath is called, then the server respons with 200', async () => {
		const result = await chai.request(app).get('/service/without/basepath');
		expect(result.status).to.equal(200);
	});

	it('when a service with basepath is called without a basepath, then the call is forwarded and succeeds', async () => {
		const result = await chai.request(app).get('/service/with/basepath');
		expect(result.status).to.equal(200);
	});

	it('when a service with basepath is called with a basepath, the call succeeds', async () => {
		const result = await chai.request(app).get('/legacy/v1/service/with/basepath');
		expect(result.status).to.equal(200);
	});
});
