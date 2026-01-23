import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';
import util from 'util';

export class AxiosErrorLoggable extends HttpException implements Loggable {
	constructor(private readonly axiosError: AxiosError, protected readonly type: string) {
		super(util.inspect(axiosError.response?.data), axiosError.status ?? HttpStatus.INTERNAL_SERVER_ERROR, {
			cause: axiosError.cause,
		});
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `message: ${this.axiosError.message} code: ${this.axiosError.code || 'Unknown code'}`,
			type: this.type,
			data: util.inspect(this.axiosError.response?.data),
			stack: this.stack,
		};
	}
}
