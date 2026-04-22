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
			logSteps: this.logSteps.join('|'),
		};
		return {
			type: 'board-error-report',
			message: this.toLogfmt(data),
		};
	}

	private toLogfmt(data: Record<string, string | number>): string {
		const escapeQuotes = (str: string): string => str.replace(/"/g, '\\"');

		const escape = (str: string): string => (/[=\s"]/.test(str) ? `"${escapeQuotes(str)}"` : str);

		return Object.entries(data)
			.map(([key, value]) => {
				const val = escape(String(value));
				return `${key}=${val}`;
			})
			.join(' ');
	}
}
