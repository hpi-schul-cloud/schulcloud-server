'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const chai = require('chai');

describe('link service', function () {
	const service = app.service('links');
	it('registered the links service', () => {
		assert.ok(service);
	});

	it(`generates a link of length ${service.Model.linkLength} that has the correct target set`, function () {
		const url = "https://schul-cloud.org/register/abcdef?param=1";
		return service.create({target: url})
			.then(data => {
				chai.expect(data.id).to.have.lengthOf(service.Model.linkLength);
				chai.expect(data.target).to.equal(url);
			});
	});
});
