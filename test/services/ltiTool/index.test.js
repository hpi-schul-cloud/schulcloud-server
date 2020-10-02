const assert = require('assert');
const appPromise = require('../../../src/app');


describe('ltiTool service', () => {
	let app;
	let ltiToolService;

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

	before(async function before() {
		app = await appPromise;
		ltiToolService = app.service('ltiTools');
		this.timeout(10000);
		await ltiToolService.create(testTool);
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
