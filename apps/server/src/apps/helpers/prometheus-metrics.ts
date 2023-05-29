import { Express } from 'express';

import { Logger, LoggableMessage } from '@src/core/logger';
import {
	PrometheusMetricsConfig,
	createAPIResponseTimeMetricMiddleware,
	createPrometheusMetricsApp,
} from '@shared/infra/metrics';

export const addPrometheusMetricsMiddlewaresIfEnabled = (logger: Logger, app: Express) => {
	if (!PrometheusMetricsConfig.instance.isEnabled) {
		logger.debug(
			new LoggableMessage('Prometheus metrics feature is disabled, no metrics middlewares will be added to the app')
		);

		return;
	}

	app.use(createAPIResponseTimeMetricMiddleware());

	logger.debug(new LoggableMessage('API response time metric middleware successfully added to the app'));
};

export const createAndStartPrometheusMetricsAppIfEnabled = (logger: Logger) => {
	if (!PrometheusMetricsConfig.instance.isEnabled) {
		logger.debug(
			new LoggableMessage('Prometheus metrics feature is disabled, Prometheus metrics app will not be created')
		);

		return;
	}

	const { route, collectDefaultMetrics, collectMetricsRouteMetrics } = PrometheusMetricsConfig.instance;

	if (!collectDefaultMetrics) {
		logger.debug(
			new LoggableMessage('Collecting default metrics is disabled so only the custom metrics will be collected')
		);
	}

	if (!collectMetricsRouteMetrics) {
		logger.debug(
			new LoggableMessage(
				'Collecting metrics route metrics is disabled so no metrics route calls will be added to the metrics'
			)
		);
	}

	const prometheusMetricsAppPort = PrometheusMetricsConfig.instance.port;

	const prometheusMetricsApp = createPrometheusMetricsApp(route, collectDefaultMetrics, collectMetricsRouteMetrics);

	prometheusMetricsApp.listen(prometheusMetricsAppPort, () => {
		logger.log(
			new LoggableMessage(
				`Prometheus metrics app successfully started listening on port ${prometheusMetricsAppPort} ` +
					`(metrics will be available on ${route} route)`
			)
		);
	});
};
