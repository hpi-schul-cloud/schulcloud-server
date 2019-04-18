const assert = require('assert');
const app = require('../../../src/app');

describe('federalState service', () => {
    it('registered the federalStates service', () => {
        assert.ok(app.service('federalStates'));
    });
});
