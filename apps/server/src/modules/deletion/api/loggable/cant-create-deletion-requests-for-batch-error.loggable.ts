import { BadRequestException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { EntityId } from '@shared/domain/types';
import { BatchStatus } from '../../domain/types';

export class CantCreateDeletionRequestsForBatchErrorLoggable extends BadRequestException implements Loggable {
	constructor(
		private readonly id: EntityId,
		private readonly batchStatus: BatchStatus
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: 'CANT_CREATE_DELETION_REQUESTS_FOR_BATCH',
			stack: this.stack,
			data: {
				id: this.id,
				batchStatus: this.batchStatus,
				errorMessage: 'Batch status must be CREATED to create deletion requests for it.',
			},
		};

		return message;
	}
}
