import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeletionBatchItemResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	status: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	validUsers: number;

	@ApiProperty()
	invalidUsers: number;

	@ApiPropertyOptional()
	skippedUsers: number;

	@ApiProperty({ type: Date })
	createdAt: Date;

	@ApiProperty({ type: Date })
	updatedAt: Date;

	constructor(item: DeletionBatchItemResponse) {
		this.id = item.id;
		this.status = item.status;
		this.name = item.name;
		this.validUsers = item.validUsers;
		this.invalidUsers = item.invalidUsers;
		this.skippedUsers = item.skippedUsers;
		this.createdAt = item.createdAt;
		this.updatedAt = item.updatedAt;
	}
}
