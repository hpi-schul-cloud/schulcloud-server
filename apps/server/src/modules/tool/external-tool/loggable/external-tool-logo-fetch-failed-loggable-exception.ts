import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error/business.error';
import { Loggable } from '@src/core/logger/interfaces/loggable';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';

export class ExternalToolLogoFetchFailedLoggableException extends BusinessError implements Loggable {
	constructor(private readonly logoUrl: string, private readonly httpStatus?: HttpStatus) {
		super(
			{
				type: 'EXTERNAL_TOOL_LOGO_FETCH_FAILED',
				title: 'External tool logo fetch failed.',
				defaultMessage: 'External tool logo could not been fetched.',
			},
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'EXTERNAL_TOOL_LOGO_FETCH_FAILED',
			message: 'External tool logo could not been fetched',
			stack: this.stack,
			data: {
				logoUrl: this.logoUrl,
				httpStatus: this.httpStatus,
			},
		};
	}
}
