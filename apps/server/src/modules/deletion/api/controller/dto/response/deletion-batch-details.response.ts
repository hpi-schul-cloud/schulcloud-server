import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { UsersByRoleResponse } from './users-by-role.response';

export class DeletionBatchDetailsResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	pendingDeletions: EntityId[];

	@ApiProperty()
	failedDeletions: EntityId[];

	@ApiProperty()
	successfulDeletions: EntityId[];

	@ApiProperty()
	skippedDeletions: UsersByRoleResponse[];

	@ApiProperty()
	invalidIds: string[];

	constructor(item: DeletionBatchDetailsResponse) {
		this.id = item.id;
		this.pendingDeletions = item.pendingDeletions;
		this.failedDeletions = item.failedDeletions;
		this.successfulDeletions = item.successfulDeletions;
		this.skippedDeletions = item.skippedDeletions;
		this.invalidIds = item.invalidIds;
	}
}
