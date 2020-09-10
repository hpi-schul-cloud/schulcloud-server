const assert = require('assert');
const app = require('../../../src/app');

const ltiToolService = app.service('ltiTools');

describe('ltiTool service', () => {
	const testTool = {
		_id: '5836bb5664582c35df3bc215',
		name: 'LTI Tools',
		url: 'http://lti.tools/test/tp.php',
		key: 'jisc.ac.uk',
		secret: 'secret',
		logo_url: '',
		lti_message_type: 'basic-lti-launch-request',
		lti_version: 'LTI-1p0',
		resource_link_id: '0',
	};

	before(function (done) {
		this.timeout(10000);
		ltiToolService.create(testTool).then((result) => {
			done();
		});
	});

	after((done) => {
		ltiToolService.remove(testTool).then((result) => {
			done();
		});
	});

	it('registered the ltiTools service', () => {
		assert.ok(ltiToolService);
	});
});
