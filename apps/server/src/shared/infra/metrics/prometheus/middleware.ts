import client from 'prom-client';
import responseTime from 'response-time';
import { Request, RequestHandler, Response } from 'express';

class RequestInfo {
	method: string;

	baseUrl: string;

	fullPath: string;

	routePath = '';

	private hasPath(reqRoute: unknown): reqRoute is { path: string } {
		return typeof reqRoute === 'object' && reqRoute != null && 'path' in reqRoute;
	}

	constructor(req: Request) {
		this.method = req.method;
		this.baseUrl = req.baseUrl;
		this.fullPath = this.baseUrl;

		if (this.hasPath(req.route)) {
			this.routePath = req.route.path;

			this.fullPath += this.routePath;
		}
	}
}

class ResponseInfo {
	statusCode: number;

	constructor(res: Response) {
		this.statusCode = res.statusCode;
	}
}

const apiResponseTimeMetricLabelNames = ['method', 'base_url', 'full_path', 'route_path', 'status_code'];

export const getAPIResponseTimeMetricLabels = (req: Request, res: Response) => {
	const reqInfo = new RequestInfo(req);
	const resInfo = new ResponseInfo(res);

	return {
		method: reqInfo.method,
		base_url: reqInfo.baseUrl,
		full_path: reqInfo.fullPath,
		route_path: reqInfo.routePath,
		status_code: resInfo.statusCode,
	};
};

export const apiResponseTimeMetricHistogram = new client.Histogram({
	name: 'sc_api_response_time_in_seconds',
	help: 'SC API response time in seconds',
	labelNames: apiResponseTimeMetricLabelNames,
});

export const createAPIResponseTimeMetricMiddleware = (): RequestHandler =>
	responseTime((req: Request, res: Response, time: number) => {
		const labels = getAPIResponseTimeMetricLabels(req, res);

		apiResponseTimeMetricHistogram.observe(labels, time / 1000);
	});
