import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { EntityId } from '@shared/domain/types';
import { ModuleName, StepStatus } from '../type';

export class UserDeletionStepOperationLoggable implements Loggable {
	constructor(
		private readonly message: string,
		private readonly module: ModuleName,
		private readonly user: EntityId,
		private readonly status: StepStatus,
		private readonly modifiedCount?: number,
		private readonly deletedCount?: number
	) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: this.message,
			data: {
				// TODO: check if renaming to "module" would be okay
				domain: this.module,
				user: this.user,
				status: this.status,
				modifiedCount: this.modifiedCount,
				deletedCount: this.deletedCount,
			},
		};
	}
}
