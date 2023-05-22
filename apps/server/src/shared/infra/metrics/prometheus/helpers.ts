import { Express } from 'express';

import { Logger, LoggableMessage } from '@src/core/logger';
import { Config } from './config';
import { createAPIResponseTimeMetricMiddleware } from './middleware';
import { createServer } from './server';

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

	const server = createServer(Config.instance.route);

	const { port } = Config.instance;

	server.listen(port, () => {
		logger.log(
			new LoggableMessage(
				`Prometheus metrics server successfully started on port ${port} (metrics route: ${Config.instance.route})`
			)
		);
	});
};
