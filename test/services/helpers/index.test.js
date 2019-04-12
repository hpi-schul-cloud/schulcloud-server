'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('mail service', function () {
	it('registered the mails service', () => {
		assert.ok(app.service('mails'));
	});
});
