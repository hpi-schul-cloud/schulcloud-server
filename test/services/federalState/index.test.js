'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('federalState service', function() {
  it('registered the federalStates service', () => {
    assert.ok(app.service('federalStates'));
  });
});
