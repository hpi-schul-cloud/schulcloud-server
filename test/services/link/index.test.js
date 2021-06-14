const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const appPromise = require('../../../src/app');

chai.use(chaiHttp);

describe('link service', () => {
	let app;
	let port;
	let server;
	let service;

	before(async () => {
		app = await appPromise;
		server = await app.listen();
		port = server.address().port;
		service = app.service('link');
	});

	after(async () => {
		await server.close();
	});

	it('registered the links service', () => {
		assert.ok(service);
	});

	it(`generates a link that has the correct target set`, async () => {
		const url = `localhost:${port}/`;
		const data = await service.create({ target: url });
		chai.expect(data._id).to.have.lengthOf(service.Model.linkLength);
		chai.expect(data.target).to.equal(url);
		const result = await chai.request(app).get(`/link/${data._id}`);
		chai.expect(result.redirects[0]).to.equal(url);
	});
});
