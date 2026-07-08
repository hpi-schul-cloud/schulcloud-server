import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class GroupRemovalSuccessfulLoggable implements Loggable {
	constructor(
		private readonly groupId: string,
		private readonly userId: string,
		private readonly groupDeleted: boolean
	) {}

	public getLogMessage(): LoggableMessage {
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
