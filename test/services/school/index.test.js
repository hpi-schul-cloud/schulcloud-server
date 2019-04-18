const assert = require('assert');
const chai = require('chai');
const app = require('../../../src/app');

describe('school service', () => {
	it('registered the schools services', () => {
		assert.ok(app.service('schools'));
	});
});

describe('years service', () => {
	it('registered the years services', () => {
		assert.ok(app.service('years'));
		assert.ok(app.service('gradeLevels'));
	});
});
