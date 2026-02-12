import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean, StringToNumber } from '@shared/controller/transformer';
import { IsBoolean, IsNumber } from 'class-validator';

export const METRICS_CONFIG_TOKEN = 'METRICS_CONFIG_TOKEN';

@Configuration()
export class MetricConfig {
	@ConfigProperty('FEATURE_PROMETHEUS_METRICS_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureMetricsEnabled = false;

	@ConfigProperty('PROMETHEUS_METRICS_PORT')
	@StringToNumber()
	@IsNumber()
	public metricsPort = 9090;

	@ConfigProperty('PROMETHEUS_METRICS_COLLECT_METRICS_ROUTE_METRICS')
	@IsBoolean()
	@StringToBoolean()
	public collectMetricsRouteMetrics = true;

	@ConfigProperty('PROMETHEUS_METRICS_COLLECT_DEFAULT_METRICS')
	@IsBoolean()
	@StringToBoolean()
	public collectDefaultMetrics = true;
}
