import { LoggingUtils } from '@infra/logger';
import { HttpException, HttpStatus } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type AxiosError } from 'axios';
import util from 'node:util';

export class AxiosErrorLoggable extends HttpException implements Loggable {
	// Only the redacted safe fields are kept: the axios error carries the request config with our credentials.
	// So util.inspect, JSON.stringify and the logger can't reach them, whichever way this exception is printed.
	private readonly axiosError: Record<string, unknown>;
	protected readonly type: string;

	constructor(axiosError: AxiosError, type: string) {
		super(axiosError.message, axiosError.status ?? HttpStatus.INTERNAL_SERVER_ERROR, {
			cause: axiosError.cause,
		});

		this.axiosError = LoggingUtils.getSafeAxiosErrorFields(axiosError);
		this.type = type;
	}

	public getLogMessage(): LoggableMessage {
		const code =
			typeof this.axiosError.code === 'string' && this.axiosError.code ? this.axiosError.code : 'Unknown code';

		return {
			message: `message: ${this.message} code: ${code}`,
			type: this.type,
			data: util.inspect(this.axiosError.responseData),
			stack: this.stack,
		};
	}

	public [util.inspect.custom](): unknown {
		return {
			name: this.name,
			message: this.message,
			status: this.getStatus(),
			type: this.type,
			axiosError: this.axiosError,
		};
	}
}
