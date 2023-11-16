import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { DeletionClientConfig } from './interface';
import { getDeletionClientConfig } from './deletion-client.config';

describe(getDeletionClientConfig.name, () => {
	let configBefore: IConfig;

	beforeAll(() => {
		configBefore = Configuration.toObject({ plainSecrets: true });
	});

	afterEach(() => {
		Configuration.reset(configBefore);
	});

	describe('when called', () => {
		const setup = () => {
			const baseUrl = 'http://api-admin:4030';
			const apiKey = '652559c2-93da-42ad-94e1-640e3afbaca0';

			Configuration.set('ADMIN_API_CLIENT__BASE_URL', baseUrl);
			Configuration.set('ADMIN_API_CLIENT__API_KEY', apiKey);

			const expectedConfig: DeletionClientConfig = {
				ADMIN_API_CLIENT_BASE_URL: baseUrl,
				ADMIN_API_CLIENT_API_KEY: apiKey,
			};

			return { expectedConfig };
		};

		it('should return config with proper values', () => {
			const { expectedConfig } = setup();

			const config = getDeletionClientConfig();

			expect(config).toEqual(expectedConfig);
		});
	});
});
