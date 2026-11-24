import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class InvalidBoardImportJobMessageLoggable implements Loggable {
	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			message: 'Board import job message without job id was dropped',
		};

		return message;
	}
}
