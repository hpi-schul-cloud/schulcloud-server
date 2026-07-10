import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type LogMessageDataObject } from '@shared/common/loggable/interfaces';

export class ErwinIdentifierLoggable implements Loggable {
	constructor(
		private readonly message: string,
		private readonly data?: LogMessageDataObject
	) {}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'ERWIN_IDENTIFIER_LOGGABLE',
			message: this.message,
			data: this.data,
		};
	}
}
