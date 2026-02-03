import { Request, Response } from 'express';
import { RequestResponseMetricLabel } from '../vo';

export class RequestResponseMetricLabelFactory {
	public static create(req: Request, res: Response): RequestResponseMetricLabel {
		const instance = new RequestResponseMetricLabel(req, res);

		return instance;
	}
}
