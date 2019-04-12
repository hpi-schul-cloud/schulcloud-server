'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('systemId service', function() {
  it('registered the systems service', () => {
    assert.ok(app.service('systems'));
  });
});
