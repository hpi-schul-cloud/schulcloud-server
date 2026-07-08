import { Loggable, LoggableMessage, LogMessageDataObject } from '@shared/common/loggable';

export class CommonCartridgeMessageLoggable implements Loggable {
	constructor(
		private readonly message: string,
		private readonly data?: LogMessageDataObject
	) {}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'COMMON_CARTRIDGE_MESSAGE_LOGGABLE',
			message: this.message,
			data: this.data,
		};
	}
}
