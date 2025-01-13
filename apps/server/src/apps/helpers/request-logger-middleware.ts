import { Request, Response, NextFunction } from 'express';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Logger } from '@nestjs/common';

export const createRequestLoggerMiddleware = (): ((
	request: Request,
	response: Response,
	next: NextFunction
) => void) => {
	const enabled = Configuration.get('REQUEST_LOGGING_ENABLED') as boolean;
	const logger = new Logger('REQUEST_LOG');

	return (request: Request, response: Response, next: NextFunction): void => {
		if (enabled) {
			const startAt = process.hrtime();
			const { method, originalUrl } = request;

			response.on('finish', () => {
				try {
					const { statusCode } = response;
					const contentLength = response.get('content-length') || 'unknown';
					const diff = process.hrtime(startAt);
					const responseTime = diff[0] * 1e3 + diff[1] * 1e-6;
					logger.log(`${method} ${originalUrl} ${statusCode} ${responseTime}ms ${contentLength}`);
				} catch (error) {
					logger.error('unable to write accesslog', error);
				}
			});
		}

		next();
	};
};
