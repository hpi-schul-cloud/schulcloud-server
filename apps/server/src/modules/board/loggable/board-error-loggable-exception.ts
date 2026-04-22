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
			v: '1.1',
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
		const escape = (str: string): string => str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

		const escapeValue = (str: string): string => (/[=\s"]/.test(str) ? `"${escape(str)}"` : str);

		return Object.entries(data)
			.map(([key, value]) => {
				const val = escapeValue(String(value));
				return `${key}=${val}`;
			})
			.join(' ');
	}
}
