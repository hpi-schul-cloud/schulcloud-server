import { Express } from 'express';

import { LegacyLogger } from '@src/core/logger';
import { PrometheusMetricsConfig } from '@src/config';
import { createAPIResponseTimeMetricMiddleware } from './middleware';
import { createServer } from './server';

export const addPrometheusMetricsMiddlewaresIfEnabled = (logger: LegacyLogger, app: Express) => {
	if (!PrometheusMetricsConfig.instance.isEnabled) {
		logger.debug('Prometheus metrics feature is disabled, omitting adding all the middlewares');

		return;
	}

	app.use(createAPIResponseTimeMetricMiddleware());
};

export const createAndStartPrometheusMetricsServerIfEnabled = (logger: LegacyLogger) => {
	if (!PrometheusMetricsConfig.instance.isEnabled) {
		logger.debug('Prometheus metrics feature is disabled, omitting creating and starting the server');

		return;
	}

	const server = createServer(PrometheusMetricsConfig.instance.route);

	const { port } = PrometheusMetricsConfig.instance;

	server.listen(port, () => {
		logger.log(
			`Prometheus metrics server started on port ${port} (metrics route: ${PrometheusMetricsConfig.instance.route})`
		);
	});
};
