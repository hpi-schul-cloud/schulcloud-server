/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { DomainModel, EntityId, StatusModel } from '@shared/domain/types';
import { ErrorLogMessage, LogMessage, Loggable, ValidationErrorLogMessage } from '@src/core/logger';

export class DataDeletionDomainOperationLoggable implements Loggable {
	constructor(
		private readonly message: string,
		private readonly domain: DomainModel,
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
