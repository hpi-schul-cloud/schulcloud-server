import { expect } from 'chai';
import http from 'http';

import incomingMessageToJson from '../../src/utils/incomingMessageToJson';

describe('[utils] incomingMessageToJson', () => {
	it('should return gerneric object without changing', () => {
		const input = { key: 1 };

		const result = incomingMessageToJson(input);

		expect(result).to.eql(input);
	});

	it('should return undefined without changing', () => {
		const input = undefined;

		const result = incomingMessageToJson(input);

		expect(result).to.eql(input);
	});

	it('should return null without changing', () => {
		const input = null;

		const result = incomingMessageToJson(input);

		expect(result).to.eql(input);
	});

	it('should return string without changing', () => {
		const input = 'text';

		const result = incomingMessageToJson(input);

		expect(result).to.eql(input);
	});

	it('should return number without changing', () => {
		const input = 123;

		const result = incomingMessageToJson(input);

		expect(result).to.eql(input);
	});

	it('should return functions without changing', () => {
		const input = () => {};

		const result = incomingMessageToJson(input);

		expect(result).to.eql(input);
	});

	it('should work for incomingMessage', () => {
		const input = new http.IncomingMessage();
		input.method = 'POST';
		input.body = { data: true };
		input.statusCode = 403;
		input.statusMessage = 'Test Message';
		input.url = 'https://hpi-schul-cloud.de';

		const result = incomingMessageToJson(input);

		expect(result).to.eql({
			statusMessage: 'Test Message',
			statusCode: 403,
			method: 'POST',
			httpVersion: null,
			headers: {},
			url: 'https://hpi-schul-cloud.de',
			body: { data: true },
		});
	});
});
