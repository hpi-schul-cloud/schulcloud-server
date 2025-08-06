import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { BadGatewayException } from '@nestjs/common';
import { BoardErrorTypeEnum } from '../interface/board-error-type.enum';
import { BoardErrorContextTypeEnum } from '../interface/board-error-context-type.enum';

export class BoardErrorLoggableException extends BadGatewayException implements Loggable {
	constructor(
		public readonly message: string,
		private readonly errorType: BoardErrorTypeEnum,
		private readonly url: string,
		private readonly contextType: BoardErrorContextTypeEnum,
		private readonly contextId: string,
		private readonly schoolId: string,
		private readonly userId: string,
		private readonly retryCount: number
	) {
		super();
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.errorType,
			message: this.message,
			stack: this.stack,
			data: {
				url: this.url,
				contextType: this.contextType,
				contextId: this.contextId,
				schoolId: this.schoolId,
				userId: this.userId,
				retryCount: this.retryCount,
			},
		};
	}
}
