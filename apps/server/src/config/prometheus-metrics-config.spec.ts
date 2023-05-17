import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { Configuration } from '@hpi-schul-cloud/commons/lib';

import { PrometheusMetricsConfig } from './prometheus-metrics-config';

describe('PrometheusMetricsConfig', () => {
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
		expect(PrometheusMetricsConfig.instance.isEnabled).toBe(false);
	});

	it("singleton should have custom 'isEnabled' flag value loaded from the configuration", () => {
		Configuration.set('FEATURE_PROMETHEUS_METRICS_ENABLED', true);
		PrometheusMetricsConfig.reload();

		expect(PrometheusMetricsConfig.instance.isEnabled).toBe(true);
	});

	it("singleton should have 'route' set to '/metrics' by default", () => {
		expect(PrometheusMetricsConfig.instance.route).toBe('/metrics');
	});

	it("singleton should have custom 'route' field value loaded from the configuration", () => {
		Configuration.set('PROMETHEUS_METRICS_ROUTE', '/prometheus');
		PrometheusMetricsConfig.reload();

		expect(PrometheusMetricsConfig.instance.route).toBe('/prometheus');
	});

	it("singleton should have 'port' set to '9090' by default", () => {
		expect(PrometheusMetricsConfig.instance.port).toBe(9090);
	});

	it("singleton should have custom 'port' field value loaded from the configuration", () => {
		Configuration.set('PROMETHEUS_METRICS_PORT', 9100);
		PrometheusMetricsConfig.reload();

		expect(PrometheusMetricsConfig.instance.port).toBe(9100);
	});
});
