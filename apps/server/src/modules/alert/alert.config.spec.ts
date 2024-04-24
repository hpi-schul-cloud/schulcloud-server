import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { getAlertConfig } from './alert.config';

describe(getAlertConfig.name, () => {
	let configBefore: IConfig;

	beforeAll(() => {
		configBefore = Configuration.toObject({ plainSecrets: true });
	});

	afterEach(() => {
		Configuration.reset(configBefore);
	});

	describe('when called', () => {
		const setup = () => {
			const baseUrl = 'http://alert-status:3349';
			const instance = 'brb';

			Configuration.set('ALERT_STATUS_URL', baseUrl);
			Configuration.set('SC_THEME', instance);
			Configuration.set('ALERT_CACHE_INTERVAL', 1);

			const expectedConfig = {
				ALERT_CACHE_INTERVAL: 1,
				SC_THEME: instance,
				ALERT_STATUS_URL: baseUrl,
			};

			return { expectedConfig };
		};

		it('should return config with proper values', () => {
			const { expectedConfig } = setup();

			const config = getAlertConfig();

			expect(config).toEqual(expectedConfig);
		});
	});
});
