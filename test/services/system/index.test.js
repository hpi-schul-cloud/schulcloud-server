

const assert = require('assert');
const app = require('../../../src/app');

describe('systemId service', () => {
	it('registered the systems service', () => {
		assert.ok(app.service('systems'));
	});
});
