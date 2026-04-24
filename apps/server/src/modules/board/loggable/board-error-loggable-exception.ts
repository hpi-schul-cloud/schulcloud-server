import { Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { BadGatewayException } from '@nestjs/common';

const SEPARATOR = '•';
const SEPARATOR_REPLACEMENT = '-';

/**
 * Loggable exception for reported board errors
 *
 * This exception is used to capture and log errors related to board operations, including context such as board, school, user, and retry information.
 *
 * Example output of `getLogMessage()`:
 *
 * ```json
 * {
 *   "type": "board-error-report",
 *   "message": "1.2•https://example.com/board/123•VALIDATION_ERROR•123•456•789•2•step1-step2-step3"
 * }
 * ```
 * the message uses a separator-based format to encode multiple pieces of information
 * important: the version (v) should be updated whenever the format of the log message changes to ensure proper and easy parsing in grafana and backward compatibility
 */
export class BoardErrorLoggableException extends BadGatewayException implements Loggable {
	constructor(
		public readonly message: string,
		private readonly errorType: string,
		private readonly url: string,
		private readonly boardId: string,
		private readonly schoolId: string,
		private readonly userId: string,
		private readonly retryCount: number,
		private readonly logSteps: string
	) {
		super();
	}

	public getLogMessage(): LogMessage | ValidationErrorLogMessage {
		const data = {
			v: '1.2', // update this value on every format change
			url: this.url,
			type: this.errorType,
			boardId: this.boardId,
			schoolId: this.schoolId,
			userId: this.userId,
			retryCount: this.retryCount,
			logSteps: this.logSteps,
		};
		return {
			type: 'board-error-report',
			message: this.composeMessage(data),
		};
	}

	private composeMessage(data: Record<string, string | number>): string {
		const values = Object.values(data).map((value) => String(value));
		const cleanedValues = this.cleanData(values);
		const message = cleanedValues.join(SEPARATOR);

		return message;
	}

	private cleanData(values: string[]): string[] {
		return values.map((item) => item.replaceAll(SEPARATOR, SEPARATOR_REPLACEMENT));
	}
}
