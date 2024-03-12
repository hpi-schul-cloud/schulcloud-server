import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, LogMessage, Loggable, ValidationErrorLogMessage } from '@src/core/logger';
import { DomainName, StatusModel } from '../types';

export class DataDeletionDomainOperationLoggable implements Loggable {
	constructor(
		private readonly message: string,
		private readonly domain: DomainName,
		private readonly user: EntityId,
		private readonly status: StatusModel,
		private readonly modifiedCount?: number,
		private readonly deletedCount?: number
	) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: this.message,
			data: {
				domain: this.domain,
				user: this.user,
				status: this.status,
				modifiedCount: this.modifiedCount,
				deletedCount: this.deletedCount,
			},
		};
	}
}
