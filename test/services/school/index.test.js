'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('school service', function() {
  it('registered the schools service', () => {
    assert.ok(app.service('schools'));
  });
});
