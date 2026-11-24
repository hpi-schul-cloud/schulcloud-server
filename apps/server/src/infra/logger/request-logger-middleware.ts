import { Logger } from '@nestjs/common';
import { type NextFunction, type Request, type Response } from 'express';
import { type LoggerConfig } from './logger.config';
import { redactSecretsInUrlPath } from './url-path-secrets';

export const createRequestLoggerMiddleware =
	(loggerConfig: LoggerConfig): ((request: Request, response: Response, next: NextFunction) => void) =>
	(request: Request, response: Response, next: NextFunction): void => {
		if (loggerConfig.requestLogEnabled) {
			const logger = new Logger('REQUEST_LOG');

			const startAt = process.hrtime();
			const { method } = request;
			const url = redactSecretsInUrlPath(request.originalUrl);

			response.on('finish', () => {
				try {
					const { statusCode } = response;
					const contentLength = response.get('content-length') ?? 'unknown';
					const diff = process.hrtime(startAt);
					const responseTime = diff[0] * 1e3 + diff[1] * 1e-6;
					logger.log(`${method} ${url} ${statusCode} ${responseTime}ms ${contentLength}`);
				} catch (error) {
					logger.error('unable to write accesslog', error);
				}
			});
		}

		next();
	};
