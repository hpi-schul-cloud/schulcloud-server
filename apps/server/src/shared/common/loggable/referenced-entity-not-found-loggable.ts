import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { EntityId } from '../../domain/types';

export class ReferencedEntityNotFoundLoggable implements Loggable {
	constructor(
		private readonly referencedId: EntityId,
		private readonly sourceEntityName: string,
		private readonly sourceId: EntityId
	) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'The requested entity could not been found, but it is still referenced.',
			data: {
				userId: this.referencedId,
				entityName: this.sourceEntityName,
				entityId: this.sourceId,
			},
		};
	}
}
