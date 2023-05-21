import { Request, Response } from 'express';
import client from 'prom-client';

export const metricsHandler = (req: Request, res: Response) => {
	client.register
		.metrics()
		.then((data) => res.status(200).send(data))
		.catch((err) => {
			res.status(500).send(err);
		});
};
