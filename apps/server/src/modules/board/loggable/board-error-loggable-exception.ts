import { Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { BadGatewayException } from '@nestjs/common';

export class BoardErrorLoggableException extends BadGatewayException implements Loggable {
	constructor(
		public readonly message: string,
		private readonly errorType: string,
		private readonly url: string,
		private readonly boardId: string,
		private readonly schoolId: string,
		private readonly userId: string,
		private readonly retryCount: number,
		private readonly os: string,
		private readonly browser: string,
		private readonly deviceType: string,
		private readonly logSteps: string[]
	) {
		super();
	}

	public getLogMessage(): LogMessage | ValidationErrorLogMessage {
		const data = {
			url: this.url,
			type: this.errorType,
			boardId: this.boardId,
			schoolId: this.schoolId,
			userId: this.userId,
			retryCount: this.retryCount,
			os: this.os,
			browser: this.browser,
			deviceType: this.deviceType,
			logSteps: this.logSteps,
		};
		return {
			type: 'board-error-report',
			message: JSON.stringify(data),
		};
	}
}
