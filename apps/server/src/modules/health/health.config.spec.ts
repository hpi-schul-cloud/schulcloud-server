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
			it("'hostname' field", () => {
				const testHostname = 'test-hostname';

				Configuration.set('HOSTNAME', testHostname);
				HealthConfig.reload();

				expect(HealthConfig.instance.hostname).toEqual(testHostname);
			});

			it("'excludeMongoDB' toggle", () => {
				Configuration.set('HEALTHCHECKS_EXCLUDE_MONGODB', true);
				HealthConfig.reload();

				expect(HealthConfig.instance.excludeMongoDB).toEqual(true);
			});
		});
	});
});
