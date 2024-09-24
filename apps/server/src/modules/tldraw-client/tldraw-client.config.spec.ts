import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
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

			Configuration.set('TLDRAW_ADMIN_API_CLIENT__BASE_URL', baseUrl);
			Configuration.set('TLDRAW_ADMIN_API_CLIENT__API_KEY', apiKey);
			Configuration.set('WITH_TLDRAW2', true);

			const expectedConfig = {
				TLDRAW_ADMIN_API_CLIENT_BASE_URL: baseUrl,
				TLDRAW_ADMIN_API_CLIENT_API_KEY: apiKey,
				WITH_TLDRAW2: true,
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
