import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class GroupRemovalSuccessfulLoggable implements Loggable {
	constructor(
		private readonly groupId: string,
		private readonly userId: string,
		private readonly groupDeleted: boolean
	) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Group removal successful',
			data: {
				groupId: this.groupId,
				userId: this.userId,
				groupDeleted: this.groupDeleted,
			},
		};
	}
}
