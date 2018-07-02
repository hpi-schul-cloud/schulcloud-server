'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('school service', function() {
  it('registered the schools services', () => {
    assert.ok(app.service('schools'));
    assert.ok(app.service('years'));
    assert.ok(app.service('gradeLevels'));
  });
});
