import { EntityId } from '@shared/domain';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '../../../core/logger';

export class MissingUserLoggable implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly entityName: string,
		private readonly entityId: EntityId
	) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `The user ith id: ${this.userId} could not been found, but is referenced in the ${this.entityName} collection with id: ${this.entityId}.`,
		};
	}
}
