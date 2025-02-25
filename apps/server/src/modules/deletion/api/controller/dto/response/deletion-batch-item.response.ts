import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UsersByRoleCountResponse } from './users-by-role-count.response';

export class DeletionBatchItemResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	status: string;

	@ApiProperty()
	name: string;

	@ApiProperty({ type: [UsersByRoleCountResponse] })
	usersByRole: UsersByRoleCountResponse[];

	@ApiProperty()
	invalidUsers: string[];

	@ApiPropertyOptional()
	skippedUsersByRole: UsersByRoleCountResponse[];

	@ApiProperty({ type: Date })
	createdAt: Date;

	@ApiProperty({ type: Date })
	updatedAt: Date;

	constructor(item: DeletionBatchItemResponse) {
		this.id = item.id;
		this.status = item.status;
		this.name = item.name;
		this.usersByRole = item.usersByRole;
		this.invalidUsers = item.invalidUsers;
		this.skippedUsersByRole = item.skippedUsersByRole;
		this.createdAt = item.createdAt;
		this.updatedAt = item.updatedAt;
	}
}
