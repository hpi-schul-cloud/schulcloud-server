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
			const apiKey = 'a4a20e6a-8036-4603-aba6-378006fedce2';

			Configuration.set('TLDRAW_ADMIN_API_CLIENT__BASE_URL', baseUrl);
			Configuration.set('TLDRAW_ADMIN_API_CLIENT__API_KEY', apiKey);

			const expectedConfig = {
				TLDRAW_ADMIN_API_CLIENT_BASE_URL: baseUrl,
				TLDRAW_ADMIN_API_CLIENT_API_KEY: apiKey,
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
