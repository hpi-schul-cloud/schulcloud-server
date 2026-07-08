import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class ShdUserCreateTokenLoggable implements Loggable {
	constructor(
		private readonly supportUserId: EntityId,
		private readonly targetUserId: EntityId,
		private readonly expiredIn: number
	) {}

	getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			message: `The support employee with the Id ${
				this.supportUserId
			} has created  a short live JWT for the user with the Id ${this.targetUserId}. The JWT expires expires in ${
				this.expiredIn / 60
			} minutes`,
			data: {},
		};

		return message;
	}
}
