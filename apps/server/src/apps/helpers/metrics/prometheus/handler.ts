import { RequestHandler, Request, Response } from 'express';
import client from 'prom-client';

export const createPrometheusMetricsHandler = (): RequestHandler => (_req: Request, res: Response) => {
	client.register
		.metrics()
		.then((data) => {
			res.setHeader('Content-Type', client.register.contentType);
			return res.status(200).send(data);
		})
		.catch(() => {
			res.status(500).send();
		});
};
