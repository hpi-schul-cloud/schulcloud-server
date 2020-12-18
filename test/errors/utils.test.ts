import { expect } from 'chai';
import http from 'http';

import { cleanupIncomingMessage } from '../../src/errors/utils';
import { Forbidden } from '../../src/errors';

const createExternalErrorResponse = (message) => {
	const method = 'PUT';
	const url = 'https://s3.data.com/';
	const body = { yes: true };
	const statusCode = 403;

	const req = new http.IncomingMessage();
	req.method = method;
	req.statusCode = statusCode;
	req.statusMessage = message;
	req.url = url;
	req.body = body;

	// fake to get the same strcture
	const options = {
		method,
		uri: url,
		body,
		simple: true,
		resolveWithFullResponse: false,
		transform2xxOnly: false,
		callback: () => {},
	};

	const error = new Error(message);
	error.options = options;
	error.response = req;
	error.statusCode = statusCode;
	error.error = message;

	return error;
};

describe('[utils] cleanupIncomingMessage', () => {
	it('should cleanup nested request errors', () => {
		const message =
			'403 - "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<Error><Code>AccessDenied</Code><Message>Access Denied.</Message><Key>/1602840390667-test.docx</Key><RequestId>LYC5XP96FHGA8O9Z</RequestId></Error>"';

		// Error structure that is throw in production
		const error = new Forbidden(message, createExternalErrorResponse(message), {
			name: 'test.docx',
			owner: '5f32b173b61c9d002bcf3333',
		});

		// test nested error request after bind on interal error
		const result = cleanupIncomingMessage(error.errors);

		expect(result, 'Should nothing return only mutate keys').to.be.undefined;
		expect(error.errors instanceof Error, 'Should not lost the passed error.').to.be.true;
		expect(typeof error.errors.response === 'object', 'Should not lost the added response').to.be.true;
		expect(error.errors.response).to.have.all.keys(
			'body',
			'headers',
			'httpVersion',
			'method',
			'statusCode',
			'statusMessage',
			'url'
		);
	});
});
