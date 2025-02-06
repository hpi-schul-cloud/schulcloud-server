import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';

export class DeletionBatchDetailsResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	status: string;

	@ApiProperty()
	pendingDeletions: EntityId[];

	@ApiProperty()
	failedDeletions: EntityId[];

	@ApiProperty()
	successfulDeletions: EntityId[];

	constructor(item: DeletionBatchDetailsResponse) {
		this.id = item.id;
		this.status = item.status;
		this.pendingDeletions = item.pendingDeletions;
		this.failedDeletions = item.failedDeletions;
		this.successfulDeletions = item.successfulDeletions;
	}
}
