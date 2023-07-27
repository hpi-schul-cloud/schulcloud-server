const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const freeport = require('freeport');
const appPromise = require('../../../src/app');
const logger = require('../../../src/logger');

chai.use(chaiHttp);

describe('link service', () => {
	let app;
	let freePort;
	let server;
	let service;

	before(async () => {
		freeport(async (err, port) => {
			if (err) {
				logger.warning('freeport:', err);
			}

			app = await appPromise();
			server = await app.listen(port);
			freePort = port;
			service = app.service('link');
		});
	});

	after(async () => {
		await server.close();
	});

	it('registered the links service', () => {
		assert.ok(service);
	});

	it(`generates a link that has the correct target set`, async () => {
		const url = `localhost:${freePort}/`;
		const data = await service.create({ target: url });
		chai.expect(data._id).to.have.lengthOf(service.Model.linkLength);
		chai.expect(data.target).to.equal(url);
		const result = await chai.request(app).get(`/link/${data._id}`);
		chai.expect(result.redirects[0]).to.equal(url);
	});
});
