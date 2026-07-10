import { Logger } from '@infra/logger';
import { type MetricConfig, METRICS_CONFIG_TOKEN, MetricsModule, ResponseTimeMetricsInterceptor } from '@infra/metrics';
import { type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { AppStartLoggable } from './app-start-loggable';

export const enum PrometheusMetricsSetupState {
	API_RESPONSE_TIME_METRIC_MIDDLEWARE_SUCCESSFULLY_ADDED = 'API response time metric middleware successfully added to the app',
	FEATURE_DISABLED_APP_WILL_NOT_BE_CREATED = 'Prometheus metrics feature is disabled - Prometheus metrics app will not be created',
	COLLECTING_METRICS_ROUTE_METRICS_DISABLED = 'Collecting metrics route metrics is disabled - no metrics route calls will be added to the metrics',
}

export class PrometheusMetricsSetupStateLoggable implements Loggable {
	constructor(private readonly state: PrometheusMetricsSetupState) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'Setting up Prometheus metrics...',
			data: {
				state: this.state,
			},
		};
	}
}

export const createMetricsServer = async (nestApp: INestApplication, appName: string): Promise<void> => {
	const metricsApp = await NestFactory.create(MetricsModule);
	const metricsConfig = await metricsApp.resolve<MetricConfig>(METRICS_CONFIG_TOKEN);
	const logger = await metricsApp.resolve(Logger);
	logger.setContext('METRICS');

	if (!metricsConfig.featureMetricsEnabled) {
		logger.info(
			new PrometheusMetricsSetupStateLoggable(PrometheusMetricsSetupState.FEATURE_DISABLED_APP_WILL_NOT_BE_CREATED)
		);
		return;
	}

	if (metricsConfig.collectMetricsRouteMetrics) {
		nestApp.useGlobalInterceptors(new ResponseTimeMetricsInterceptor());
		logger.info(
			new PrometheusMetricsSetupStateLoggable(
				PrometheusMetricsSetupState.API_RESPONSE_TIME_METRIC_MIDDLEWARE_SUCCESSFULLY_ADDED
			)
		);
	} else {
		logger.info(
			new PrometheusMetricsSetupStateLoggable(PrometheusMetricsSetupState.COLLECTING_METRICS_ROUTE_METRICS_DISABLED)
		);
	}

	const { metricsPort } = metricsConfig;

	await metricsApp.listen(metricsPort, () => {
		const appStartLoggable = new AppStartLoggable({ appName, port: metricsPort });
		logger.setContext('METRICS');
		logger.info(appStartLoggable);
	});
};
