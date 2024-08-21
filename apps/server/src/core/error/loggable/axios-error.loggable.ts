import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { AxiosError } from 'axios';

export class AxiosErrorLoggable extends HttpException implements Loggable {
	constructor(private readonly axiosError: AxiosError, protected readonly type: string) {
		super(JSON.stringify(axiosError.response?.data), axiosError.status ?? HttpStatus.INTERNAL_SERVER_ERROR, {
			cause: axiosError.cause,
		});
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `message: ${this.axiosError.message} code: ${this.axiosError.code || 'Unknown code'}`,
			type: this.type,
			data: JSON.stringify(this.axiosError.response?.data),
			stack: this.axiosError.stack,
		};
	}
}
