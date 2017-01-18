'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('fileStorage service', function() {
  it('registered the fileStorage service', () => {
    assert.ok(app.service('fileStorage'));
  });
});
