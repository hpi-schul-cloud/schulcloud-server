'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('role service', function () {
    it('registered the roles service', () => {
        assert.ok(app.service('roles'));
    });
});
