import { Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { BadGatewayException } from '@nestjs/common';

const SEPARATOR = ' | ';
const SEPARATOR_REPLACEMENT = '-|-';

/**
 * Loggable exception for reported board errors
 *
 * This exception is used to capture and log errors related to board operations - especially connection issues.
 * If the Websocket connection can not be established - the client uses this endpoint to communicate connection errors.
 *
 * The message uses a separator-based format to encode multiple values of information.
 *
 * The version (v) should be updated whenever the format of the log message changes. This allows grafana log-queries to support multiple versions of the log message format in one graph or table.
 *
 * Example output of `getLogMessage()`:
 * ```json
 * {
 *   "type": "board-error-report",
 *   "message": "1.3 | https://example.com/board/123 | CONNECTION_ERROR | 12a3 | 45c6 | 78e9 | 2 | step1-step2-step3"
 * }
 * ```
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
			v: '1.3', // update this value whenever the format or separator changes
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
