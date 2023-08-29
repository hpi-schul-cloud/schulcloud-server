import { EntityId } from '@shared/domain';
import { CrudOperation } from '@shared/types';
import { LogMessage, Loggable } from '@src/core/logger';

export class DemoSchoolCreateLoggable implements Loggable {
	constructor(private readonly userId: EntityId) {}

	getLogMessage(): LogMessage {
		return {
			message: 'Creating demo school',
			data: {
				operation: CrudOperation.CREATE,
				userId: this.userId,
			},
		};
	}
}
