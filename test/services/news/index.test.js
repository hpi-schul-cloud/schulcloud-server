'use strict';

const assert = require('assert');
const app = require('../../../src/news');

describe('news service', function() {
  it('registered the news service', () => {
    assert.ok(app.service('news'));
  });
});
