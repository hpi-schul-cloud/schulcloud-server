import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { Configuration } from '@hpi-schul-cloud/commons/lib';

import { Config } from './config';

describe('Config', () => {
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

	it("singleton should have 'isEnabled' flag set to 'false' by default", () => {
		expect(Config.instance.isEnabled).toBe(false);
	});

	it("singleton should have custom 'isEnabled' flag value loaded from the configuration", () => {
		Configuration.set('FEATURE_PROMETHEUS_METRICS_ENABLED', true);
		Config.reload();

		expect(Config.instance.isEnabled).toBe(true);
	});

	it("singleton should have 'route' set to '/metrics' by default", () => {
		expect(Config.instance.route).toBe('/metrics');
	});

	it("singleton should have custom 'route' field value loaded from the configuration", () => {
		Configuration.set('PROMETHEUS_METRICS_ROUTE', '/prometheus');
		Config.reload();

		expect(Config.instance.route).toBe('/prometheus');
	});

	it("singleton should have 'port' set to '9090' by default", () => {
		expect(Config.instance.port).toBe(9090);
	});

	it("singleton should have custom 'port' field value loaded from the configuration", () => {
		Configuration.set('PROMETHEUS_METRICS_PORT', 9100);
		Config.reload();

		expect(Config.instance.port).toBe(9100);
	});
});
