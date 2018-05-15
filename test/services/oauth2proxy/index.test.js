'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const chai = require('chai');

describe('oauth2proxy service', function() {
	this.timeout(10000);

	it('consentRequest endpoint is registered', () => {
		assert.ok(app.service('/oauth2proxy/consentRequest'));
		assert.ok(app.service('/oauth2proxy/consentRequest').get);
		assert.ok(app.service('/oauth2proxy/consentRequest').patch);
	});

	it('introspect endpoint is registered', () => {
		assert.ok(app.service('/oauth2proxy/introspect'));
		assert.ok(app.service('/oauth2proxy/introspect').create);
	});

});
