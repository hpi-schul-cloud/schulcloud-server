import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';

export class DeletionBatchDetailsResponse {
	@ApiProperty()
	public id: string;

	@ApiProperty()
	public name: string;

	@ApiProperty()
	public status: string;

	@ApiProperty()
	public validUsers: string[];

	@ApiProperty()
	public invalidUsers: string[];

	@ApiProperty()
	public skippedUsers: string[];

	@ApiProperty()
	public pendingDeletions: EntityId[];

	@ApiProperty()
	public failedDeletions: EntityId[];

	@ApiProperty()
	public successfulDeletions: EntityId[];

	@ApiProperty({ type: Date })
	public createdAt: Date;

	@ApiProperty({ type: Date })
	public updatedAt: Date;

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
