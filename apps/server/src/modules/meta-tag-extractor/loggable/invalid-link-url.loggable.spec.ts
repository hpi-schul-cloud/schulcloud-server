import { InvalidLinkUrlLoggableException } from './invalid-link-url.loggable';

describe('InvalidLinkUrlLoggableException', () => {
	it('should implement Loggable interface', () => {
		const exception = new InvalidLinkUrlLoggableException('http://invalid.url', 'Invalid URL');
		expect(typeof exception.getLogMessage).toBe('function');
	});

	it('should return correct log message', () => {
		const url = 'http://invalid.url';
		const message = 'Invalid URL';
		const exception = new InvalidLinkUrlLoggableException(url, message);

		expect(exception.getLogMessage()).toEqual({
			type: 'INVALID_LINK_URL',
			message,
			stack: exception.stack,
			data: {
				url,
			},
		});
	});
});
