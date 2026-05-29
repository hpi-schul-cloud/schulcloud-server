import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeletionBatchItemResponse {
	@ApiProperty()
	public id: string;

	@ApiProperty()
	public status: string;

	@ApiProperty()
	public name: string;

	@ApiProperty()
	public validUsers: number;

	@ApiProperty()
	public invalidUsers: number;

	@ApiPropertyOptional()
	public skippedUsers: number;

	@ApiProperty({ type: Date })
	public createdAt: Date;

	@ApiProperty({ type: Date })
	public updatedAt: Date;

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
