const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const freeport = require('freeport');
const appPromise = require('../../../src/app');
const logger = require('../../../src/logger');

chai.use(chaiHttp);

describe('link service', () => {
	let app;
	let port;
	let server;
	let service;

	before(async () => {
		port = await new Promise((resolve, reject) => {
			freeport((err, freePort) => {
				if (err) {
					logger.error('freeport:', err);
					reject(err);
				}
				resolve(freePort);
			});
		});

		app = await appPromise();
		server = await app.listen(port);
		service = app.service('link');
	});

	after(async () => {
		await server.close();
	});

	it('registered the links service', () => {
		assert.ok(service);
	});

	it(`generates a link that has the correct target set`, async () => {
		const url = `http://localhost:${port}/`;

		const data = await service.create({ target: url });
		chai.expect(data._id).to.have.lengthOf(service.Model.linkLength);
		chai.expect(data.target).to.equal(url);

		const result = await chai.request(app).get(`/link/${data._id}`);
		chai.expect(result.redirects[0]).to.equal(url);
	});
});
