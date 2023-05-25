import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { Configuration } from '@hpi-schul-cloud/commons/lib';

import { PrometheusMetricsConfig } from './config';

describe('PrometheusMetricsConfig singleton instance', () => {
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

	describe('should have proper default value for the', () => {
		it("'isEnabled' feature flag", () => {
			expect(PrometheusMetricsConfig.instance.isEnabled).toBe(false);
		});

		it("'route' field", () => {
			expect(PrometheusMetricsConfig.instance.route).toBe('/metrics');
		});

		it("'port' field", () => {
			expect(PrometheusMetricsConfig.instance.port).toBe(9090);
		});

		it("'collectDefaultMetrics' toggle", () => {
			expect(PrometheusMetricsConfig.instance.collectDefaultMetrics).toBe(true);
		});

		it("'collectMetricsRouteMetrics' toggle", () => {
			expect(PrometheusMetricsConfig.instance.collectMetricsRouteMetrics).toBe(true);
		});
	});

	describe('should have proper custom value loaded from the configuration for the', () => {
		it("'isEnabled' feature flag", () => {
			Configuration.set('FEATURE_PROMETHEUS_METRICS_ENABLED', true);
			PrometheusMetricsConfig.reload();

			expect(PrometheusMetricsConfig.instance.isEnabled).toBe(true);
		});

		it("'route' field", () => {
			Configuration.set('PROMETHEUS_METRICS_ROUTE', '/prometheus');
			PrometheusMetricsConfig.reload();

			expect(PrometheusMetricsConfig.instance.route).toBe('/prometheus');
		});

		it("'port' field", () => {
			Configuration.set('PROMETHEUS_METRICS_PORT', 9100);
			PrometheusMetricsConfig.reload();

			expect(PrometheusMetricsConfig.instance.port).toBe(9100);
		});

		it("'collectDefaultMetrics' toggle", () => {
			Configuration.set('PROMETHEUS_METRICS_COLLECT_DEFAULT_METRICS', false);
			PrometheusMetricsConfig.reload();

			expect(PrometheusMetricsConfig.instance.collectDefaultMetrics).toBe(false);
		});

		it("'collectMetricsRouteMetrics' toggle", () => {
			Configuration.set('PROMETHEUS_METRICS_COLLECT_METRICS_ROUTE_METRICS', false);
			PrometheusMetricsConfig.reload();

			expect(PrometheusMetricsConfig.instance.collectMetricsRouteMetrics).toBe(false);
		});
	});
});
