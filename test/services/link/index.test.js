'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

describe('link service', function () {
	const service = app.service('link');
	it('registered the links service', () => {
		assert.ok(service);
	});

	it(`generates a link of length ${service.Model.linkLength} that has the correct target set`, function () {
		this.timeout(10000);

		const url = "https://schul-cloud.org/";
		return service.create({target: url})
			.then(data => {
				chai.expect(data.id).to.have.lengthOf(service.Model.linkLength);
				chai.expect(data.target).to.equal(url);
				return Promise.resolve(data.id);
			})
			.then(id => {
				return new Promise((resolve, reject) => {
					chai.request(app)
						.get(`/link/${id}`)
						.end((error, result) => {
							if(error) return reject(error);
							chai.expect(result.redirects[0]).to.equal(url);
							resolve();
						});
				});

			});
	});
});
