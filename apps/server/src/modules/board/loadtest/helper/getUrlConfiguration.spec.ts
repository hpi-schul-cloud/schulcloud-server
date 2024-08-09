import { getUrlConfiguration } from './getUrlConfiguration';

describe('getUrlConfiguration', () => {
	it('should return the correct configuration for localhost', () => {
		const urlConfiguration = getUrlConfiguration();

		expect(urlConfiguration).toEqual({
			websocket: 'http://localhost:4450',
			api: 'http://localhost:3030',
			web: 'http://localhost:4000',
		});
	});

	it('should return the correct configuration for a custom target', () => {
		const urlConfiguration = getUrlConfiguration('http://example.com');

		expect(urlConfiguration).toEqual({
			websocket: 'http://example.com',
			api: 'http://example.com',
			web: 'http://example.com',
		});
	});
});
