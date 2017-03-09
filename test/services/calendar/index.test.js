'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('calendar service', function () {
	const service = app.service('calendar');
	it('registered the calendar service', () => {
		assert.ok(service);
	});
});
