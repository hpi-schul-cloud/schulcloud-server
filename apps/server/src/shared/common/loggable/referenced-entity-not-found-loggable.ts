import { EntityId } from '../../domain/types';
import { Loggable, LoggableMessage } from './interfaces';

export class ReferencedEntityNotFoundLoggable implements Loggable {
	constructor(
		private readonly sourceEntityName: string,
		private readonly sourceEntityId: EntityId,
		private readonly referencedEntityName: string,
		private readonly referencedEntityId: EntityId
	) {}

	getLogMessage(): LoggableMessage {
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
