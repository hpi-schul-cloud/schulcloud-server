import { HttpException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { AxiosError } from 'axios';

export class AxiosErrorLoggable extends HttpException implements Loggable {
	constructor(private readonly axiosError: AxiosError, protected readonly type: string) {
		super(JSON.stringify(axiosError.response?.data), axiosError.status ?? 500, { cause: axiosError.cause });
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: this.axiosError.message,
			type: this.type,
			error: this.axiosError.response?.data as Error,
			stack: this.axiosError.stack,
		};
	}
}
