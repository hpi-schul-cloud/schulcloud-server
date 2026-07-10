import { BadRequestException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';
import { type BatchStatus } from '../../domain/types';

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
