const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../../src/app');
const { API_HOST } = require('../../../config/globals');

chai.use(chaiHttp);

describe('link service', () => {
	let server;

	before((done) => {
		server = app.listen(3031, done);
	});

	after((done) => {
		server.close(done);
	});

	const service = app.service('link');
	it('registered the links service', () => {
		assert.ok(service);
	});

	it(`generates a link of length ${service.Model.linkLength} that has the correct target set`, function test() {
		this.timeout(10000);

		const url = 'localhost:3031/';
		return service.create({ target: url })
			.then((data) => {
				chai.expect(data._id).to.have.lengthOf(service.Model.linkLength);
				chai.expect(data.target).to.equal(url);
				return Promise.resolve(data._id);
			})
			.then((id) => new Promise((resolve, reject) => {
				chai.request(app)
					.get(`/link/${id}`)
					.end((error, result) => {
						if (error) return reject(error);
						chai.expect(result.redirects[0]).to.equal(url);
						return resolve();
					});
			}));
	});
});
