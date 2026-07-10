import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';

export class DeletionBatchDetailsResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	status: string;

	@ApiProperty()
	validUsers: string[];

	@ApiProperty()
	invalidUsers: string[];

	@ApiProperty()
	skippedUsers: string[];

	@ApiProperty()
	pendingDeletions: EntityId[];

	@ApiProperty()
	failedDeletions: EntityId[];

	@ApiProperty()
	successfulDeletions: EntityId[];

	@ApiProperty({ type: Date })
	createdAt: Date;

	@ApiProperty({ type: Date })
	updatedAt: Date;

	constructor(item: DeletionBatchDetailsResponse) {
		this.id = item.id;
		this.name = item.name;
		this.status = item.status;
		this.validUsers = item.validUsers;
		this.invalidUsers = item.invalidUsers;
		this.skippedUsers = item.skippedUsers;
		this.pendingDeletions = item.pendingDeletions;
		this.failedDeletions = item.failedDeletions;
		this.successfulDeletions = item.successfulDeletions;
		this.createdAt = item.createdAt;
		this.updatedAt = item.updatedAt;
	}
}
