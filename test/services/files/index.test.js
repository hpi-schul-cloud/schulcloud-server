'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('files service', function() {
  it('registered the files service', () => {
    assert.ok(app.service('files'));
  });
});
