import { BadRequestException } from '@nestjs/common';
import { ErrorLogMessage } from '@shared/common/error';
import { Loggable } from '@shared/common/loggable';
import { EntityId } from '@shared/domain/types';
import { BatchStatus } from '../../domain/types';

export class CantCreateDeletionRequestsForBatchErrorLoggable extends BadRequestException implements Loggable {
	constructor(private readonly id: EntityId, private readonly batchStatus: BatchStatus) {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
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
