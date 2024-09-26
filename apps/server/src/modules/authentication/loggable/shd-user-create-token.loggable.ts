import { EntityId } from '@shared/domain/types';
import { Loggable } from '@src/core/logger/interfaces';
import { LogMessage } from '@src/core/logger/types';

export class ShdUserCreateTokenLoggable implements Loggable {
	constructor(private supportUserId: EntityId, private targetUserId: EntityId, private expiredIn: number) {}

	getLogMessage(): LogMessage {
		const message: LogMessage = {
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
