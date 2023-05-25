import { RequestHandler, Request, Response } from 'express';
import client from 'prom-client';

export const createPrometheusMetricsHandler = (): RequestHandler => (req: Request, res: Response) => {
	client.register
		.metrics()
		.then((data) => res.status(200).send(data))
		.catch((err) => {
			res.status(500).send(err);
		});
};
