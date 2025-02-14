import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { DeletionRequestResponse } from './deletion-request.response';

export class DeletionBatchResponse {
	@ApiProperty()
	batchId!: EntityId;

	constructor(props: { batchId: EntityId; deletionRequests: DeletionRequestResponse[] }) {
		this.batchId = props.batchId;
	}
}
