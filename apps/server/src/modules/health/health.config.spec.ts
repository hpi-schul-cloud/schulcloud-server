import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { Configuration } from '@hpi-schul-cloud/commons';

import { HealthConfig } from './health.config';

describe(HealthConfig.name, () => {
	describe('singleton instance', () => {
		let configBefore: IConfig;

		beforeAll(() => {
			configBefore = Configuration.toObject({ plainSecrets: true });
		});

		beforeEach(() => {
			Configuration.reset(configBefore);
		});

		afterAll(() => {
			Configuration.reset(configBefore);
		});

		describe('should have correct default value for the', () => {
			it("'excludeMongoDB' toggle", () => {
				expect(HealthConfig.instance.excludeMongoDB).toEqual(false);
			});
		});

		describe('should have correct value loaded from the configuration for the', () => {
			const setup = (configVarKey: string, configVarValue: any) => {
				Configuration.set(configVarKey, configVarValue);
				HealthConfig.reload();
			};

			it("'hostname' field", () => {
				const expectedHostname = 'test-hostname';
				setup('HOSTNAME', expectedHostname);

				expect(HealthConfig.instance.hostname).toEqual(expectedHostname);
			});

			it("'excludeMongoDB' toggle", () => {
				const expectedHealthChecksExcludeMongoDB = true;
				setup('HEALTH_CHECKS_EXCLUDE_MONGODB', expectedHealthChecksExcludeMongoDB);

				expect(HealthConfig.instance.excludeMongoDB).toEqual(expectedHealthChecksExcludeMongoDB);
			});
		});
	});
});
