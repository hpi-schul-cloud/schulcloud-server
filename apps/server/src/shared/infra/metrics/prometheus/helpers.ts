import { Express } from 'express';

import { Logger, LoggableMessage } from '@src/core/logger';
import { Config } from './config';
import { createAPIResponseTimeMetricMiddleware } from './middleware';
import { createPrometheusMetricsServer } from './server';

export const addPrometheusMetricsMiddlewaresIfEnabled = (logger: Logger, app: Express) => {
	if (!Config.instance.isEnabled) {
		logger.debug(new LoggableMessage('Prometheus metrics feature is disabled, omitting adding metrics middlewares'));

		return;
	}

	app.use(createAPIResponseTimeMetricMiddleware());
};

export const createAndStartPrometheusMetricsServerIfEnabled = (logger: Logger) => {
	if (!Config.instance.isEnabled) {
		logger.debug(
			new LoggableMessage('Prometheus metrics feature is disabled, omitting creating and starting the server')
		);

		return;
	}

	const { route } = Config.instance;

	logger.debug(new LoggableMessage(`Collected Prometheus metrics will be exported at ${route} endpoint`));

	const { collectDefaultMetrics } = Config.instance;

	if (!collectDefaultMetrics) {
		logger.debug(
			new LoggableMessage('Collecting default metrics is disabled, only the custom metrics will be collected')
		);
	}
	const { collectMetricsRouteMetrics } = Config.instance;

	if (!collectMetricsRouteMetrics) {
		logger.debug(
			new LoggableMessage(
				'Collecting metrics route metrics is disabled so no metrics route calls will be added to the metrics'
			)
		);
	}

	const server = createPrometheusMetricsServer(Config.instance.route, collectDefaultMetrics, collectMetricsRouteMetrics);

	const { port } = Config.instance;

	server.listen(port, () => {
		logger.log(
			new LoggableMessage(
				`Prometheus metrics server successfully started on port ${port} (metrics route: ${Config.instance.route})`
			)
		);
	});
};
