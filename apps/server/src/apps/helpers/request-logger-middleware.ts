import { Request, Response, NextFunction } from 'express';
import { Logger } from '@src/core/logger';
import { RequestLoggable } from '@src/apps/helpers/request-loggable';
import { Configuration } from '@hpi-schul-cloud/commons/lib';

export const createRequestLoggerMiddleware = (
	logger: Logger
): ((request: Request, response: Response, next: NextFunction) => void) => {
	logger.setContext('AppLoggerMiddleware');
	const enabled = Configuration.get('REQUEST_LOGGING_ENABLED') as boolean;

	return (request: Request, response: Response, next: NextFunction): void => {
		if (enabled) {
			const startAt = process.hrtime();
			const { method, originalUrl } = request;

			response.on('finish', () => {
				const { statusCode } = response;
				const contentLength = response.get('content-length') || 'unknown';
				const diff = process.hrtime(startAt);
				const responseTime = diff[0] * 1e3 + diff[1] * 1e-6;
				logger.info(new RequestLoggable({ method, originalUrl, statusCode, responseTime, contentLength }));
			});
		}

		next();
	};
};
