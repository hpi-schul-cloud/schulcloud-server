'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('statistic service', function() {
	it('registered the statistics service', () => {
		assert.ok(app.service('statistics'));
	});

	it('should be able to trigger fetch route', () => {
		assert.ok(app.service('statistics/fetch').find());
	});

	it('should be able to trigger recent route', () => {
		assert.ok(app.service('statistics/recent').find());
	});
});
