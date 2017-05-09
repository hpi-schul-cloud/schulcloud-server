'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('notification service', function () {
	const service = app.service('notification');
	it('registered the notification service', () => {
		assert.ok(service);
	});
});
