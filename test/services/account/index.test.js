'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('account service', function() {
  it('registered the accounts service', () => {
    assert.ok(app.service('accounts'));
  });
});
