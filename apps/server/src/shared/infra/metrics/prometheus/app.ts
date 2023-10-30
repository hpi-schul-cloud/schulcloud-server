import express, { Express } from 'express';
import client from 'prom-client';
import { createPrometheusMetricsHandler } from './handler';
import { createAPIResponseTimeMetricMiddleware } from './middleware';

export const createPrometheusMetricsApp = (
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
