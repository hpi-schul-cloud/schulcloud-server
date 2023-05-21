import express, { Express } from 'express';
import client from 'prom-client';

import { metricsHandler } from './handler';

export const createServer = (metricsRoute: string): Express => {
	const app = express();

	client.collectDefaultMetrics();

	app.get(metricsRoute, metricsHandler);

	return app;
};
