'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('consent service', function() {
  it('registered the consent service', () => {
    assert.ok(app.service('consents'));
  });
});