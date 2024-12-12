import { Loggable, LogMessage } from '@src/core/logger';

interface RequestLogInfo {
	method: string;
	originalUrl: string;
	statusCode: number;
	responseTime: number;
	contentLength: string;
}

export class RequestLoggable implements Loggable {
	constructor(private readonly requestLog: RequestLogInfo) {}

	public getLogMessage(): LogMessage {
		return {
			message: `${this.requestLog.method} ${this.requestLog.originalUrl} ${this.requestLog.statusCode} ${this.requestLog.responseTime}ms ${this.requestLog.contentLength}`,
		};
		// return {
		// 	message: 'loggables rock',
		// 	data: {
		// 		method: this.requestLog.method,
		// 		originalUrl: this.requestLog.originalUrl,
		// 		statusCode: this.requestLog.statusCode,
		// 		responseTime: `${this.requestLog.responseTime}ms`,
		// 		contentLength: this.requestLog.contentLength,
		// 	},
		// };
	}
}
