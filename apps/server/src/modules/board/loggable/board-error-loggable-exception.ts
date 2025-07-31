import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { BadGatewayException } from '@nestjs/common';
import { BoardErrorTypeEnum } from '../interface/board-error-type.enum';
import { BoardErrorContextTypeEnum } from '../interface/board-error-context-type.enum';

export class BoardErrorLoggableException extends BadGatewayException implements Loggable {
	constructor(
		private readonly errorType: BoardErrorTypeEnum,
		private readonly pageUrl: string,
		private readonly contextType: BoardErrorContextTypeEnum,
		private readonly contextId: string,
		private readonly schoolId: string,
		private readonly userId: string,
		private readonly errorMessage: string,
		private readonly timestamp: string
	) {
		super();
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.errorType,
			message: this.errorMessage,
			stack: this.stack,
			data: {
				pageUrl: this.pageUrl,
				contextType: this.contextType,
				contextId: this.contextId,
				schoolId: this.schoolId,
				userId: this.userId,
				timestamp: this.timestamp,
			},
		};
	}
}
