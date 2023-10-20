import { Express } from 'express';

import { LogMessage, Loggable, Logger } from '@src/core/logger';
import {
	PrometheusMetricsConfig,
	createAPIResponseTimeMetricMiddleware,
	createPrometheusMetricsApp,
} from '@shared/infra/metrics';
import { AppStartLoggable } from './app-start-loggable';

export const enum PrometheusMetricsSetupState {
	FEATURE_DISABLED_MIDDLEWARES_WILL_NOT_BE_CREATED = 'Prometheus metrics feature is disabled - no metrics middlewares will be added to the app',
	API_RESPONSE_TIME_METRIC_MIDDLEWARE_SUCCESSFULLY_ADDED = 'API response time metric middleware successfully added to the app',
	FEATURE_DISABLED_APP_WILL_NOT_BE_CREATED = 'Prometheus metrics feature is disabled - Prometheus metrics app will not be created',
	COLLECTING_DEFAULT_METRICS_DISABLED = 'Collecting default metrics is disabled - only the custom metrics will be collected',
	COLLECTING_METRICS_ROUTE_METRICS_DISABLED = 'Collecting metrics route metrics is disabled - no metrics route calls will be added to the metrics',
}

export class PrometheusMetricsSetupStateLoggable implements Loggable {
	constructor(private readonly state: PrometheusMetricsSetupState) {}

	getLogMessage(): LogMessage {
		return {
			message: 'Setting up Prometheus metrics...',
			data: {
				state: this.state,
			},
		};
	}
}

export const addPrometheusMetricsMiddlewaresIfEnabled = (logger: Logger, app: Express) => {
	if (!PrometheusMetricsConfig.instance.isEnabled) {
		logger.debug(
			new PrometheusMetricsSetupStateLoggable(
				PrometheusMetricsSetupState.FEATURE_DISABLED_MIDDLEWARES_WILL_NOT_BE_CREATED
			)
		);

		return;
	}

	app.use(createAPIResponseTimeMetricMiddleware());

	logger.debug(
		new PrometheusMetricsSetupStateLoggable(
			PrometheusMetricsSetupState.API_RESPONSE_TIME_METRIC_MIDDLEWARE_SUCCESSFULLY_ADDED
		)
	);
};

export const createAndStartPrometheusMetricsAppIfEnabled = (logger: Logger) => {
	if (!PrometheusMetricsConfig.instance.isEnabled) {
		logger.debug(
			new PrometheusMetricsSetupStateLoggable(PrometheusMetricsSetupState.FEATURE_DISABLED_APP_WILL_NOT_BE_CREATED)
		);

		return;
	}

	const { route, collectDefaultMetrics, collectMetricsRouteMetrics } = PrometheusMetricsConfig.instance;

	if (!collectDefaultMetrics) {
		logger.debug(
			new PrometheusMetricsSetupStateLoggable(PrometheusMetricsSetupState.COLLECTING_DEFAULT_METRICS_DISABLED)
		);
	}

	if (!collectMetricsRouteMetrics) {
		logger.debug(
			new PrometheusMetricsSetupStateLoggable(PrometheusMetricsSetupState.COLLECTING_METRICS_ROUTE_METRICS_DISABLED)
		);
	}

	const prometheusMetricsAppPort = PrometheusMetricsConfig.instance.port;

	const prometheusMetricsApp = createPrometheusMetricsApp(route, collectDefaultMetrics, collectMetricsRouteMetrics);

	prometheusMetricsApp.listen(prometheusMetricsAppPort, () => {
		logger.log(
			new AppStartLoggable({
				appName: 'Prometheus metrics server app',
				port: prometheusMetricsAppPort,
				mountsDescription: `${route} --> Prometheus metrics`,
			})
		);
	});
};
