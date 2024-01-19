import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { EntityId } from '../../domain/types';

export class ReferencedEntityNotFoundLoggable implements Loggable {
	constructor(
		private readonly sourceEntityName: string,
		private readonly sourceEntityId: EntityId,
		private readonly referencedEntityName: string,
		private readonly referencedEntityId: EntityId
	) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'The requested entity could not been found, but it is still referenced.',
			data: {
				referencedEntityName: this.referencedEntityName,
				referencedEntityId: this.referencedEntityId,
				sourceEntityName: this.sourceEntityName,
				sourceEntityId: this.sourceEntityId,
			},
		};
	}
}
