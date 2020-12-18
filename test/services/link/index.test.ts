import assert from 'assert';
import chai from 'chai';
import chaiHttp from 'chai-http';
import appPromise from '../../../src/app';

chai.use(chaiHttp);

describe('link service', () => {
	let app;
	let server;
	let service;

	before(async () => {
		app = await appPromise;
		service = app.service('link');
		server = await app.listen(3031);
	});

	after((done) => {
		server.close(done);
	});

	it('registered the links service', () => {
		assert.ok(service);
	});

	it(`generates a link that has the correct target set`, function test() {
		this.timeout(10000);

		const url = 'localhost:3031/';
		return service
			.create({ target: url })
			.then((data) => {
				chai.expect(data._id).to.have.lengthOf(service.Model.linkLength);
				chai.expect(data.target).to.equal(url);
				return Promise.resolve(data._id);
			})
			.then(
				(id) =>
					new Promise((resolve, reject) => {
						chai
							.request(app)
							.get(`/link/${id}`)
							.end((error, result) => {
								if (error) return reject(error);
								chai.expect(result.redirects[0]).to.equal(url);
								return resolve();
							});
					})
			);
	});
});
