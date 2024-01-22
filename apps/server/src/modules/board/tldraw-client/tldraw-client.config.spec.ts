import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { getTldrawClientConfig } from './tldraw-client.config';

describe(getTldrawClientConfig.name, () => {
	let configBefore: IConfig;

	beforeAll(() => {
		configBefore = Configuration.toObject({ plainSecrets: true });
	});

	afterEach(() => {
		Configuration.reset(configBefore);
	});

	describe('when called', () => {
		const setup = () => {
			const baseUrl = 'http://tldraw-server-svc:3349';
			const apiKey = '7ccd4e11-c6f6-48b0-81eb-cccf7922e7a4';
			const incomingRequestTimeout = 8000;
			const nestLogLevel = 'error';

			Configuration.set('TLDRAW_ADMIN_API_CLIENT__BASE_URL', baseUrl);
			Configuration.set('TLDRAW_ADMIN_API_CLIENT__API_KEY', apiKey);
			Configuration.set('INCOMING_REQUEST_TIMEOUT_API', incomingRequestTimeout);
			Configuration.set('NEST_LOG_LEVEL', nestLogLevel);

			const expectedConfig = {
				TLDRAW_ADMIN_API_CLIENT_BASE_URL: baseUrl,
				TLDRAW_ADMIN_API_CLIENT_API_KEY: apiKey,
				INCOMING_REQUEST_TIMEOUT: incomingRequestTimeout,
				NEST_LOG_LEVEL: nestLogLevel,
			};

			return { expectedConfig };
		};

		it('should return config with proper values', () => {
			const { expectedConfig } = setup();

			const config = getTldrawClientConfig();

			expect(config).toEqual(expectedConfig);
		});
	});
});
