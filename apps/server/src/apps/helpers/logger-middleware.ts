import { Request, Response, NextFunction } from 'express';
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
	private logger = new Logger('HTTP');

	public use(request: Request, response: Response, next: NextFunction): void {
		const startAt = process.hrtime();
		const { method, originalUrl } = request;

		response.on('finish', () => {
			const { statusCode } = response;
			const contentLength = response.get('content-length') || 'unknown';
			const diff = process.hrtime(startAt);
			const responseTime = diff[0] * 1e3 + diff[1] * 1e-6;
			this.logger.log(`${method} ${originalUrl} ${statusCode} ${responseTime}ms ${contentLength}`);
		});

		next();
	}
}