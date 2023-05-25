import express, { Express } from 'express';
import client from 'prom-client';

import { createAPIResponseTimeMetricMiddleware } from './middleware';
import { createPrometheusMetricsHandler } from './handler';

export const createPrometheusMetricsServer = (
	metricsRoute: string,
	collectDefaultMetrics: boolean,
	collectMetricsRouteMetrics: boolean
): Express => {
	if (collectDefaultMetrics) {
		client.collectDefaultMetrics();
	}

	const app = express();

	if (collectMetricsRouteMetrics) {
		app.use(createAPIResponseTimeMetricMiddleware());
	}

	app.get(metricsRoute, createPrometheusMetricsHandler());

	return app;
};
