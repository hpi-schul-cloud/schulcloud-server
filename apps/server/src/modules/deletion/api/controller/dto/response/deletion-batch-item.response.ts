import { ApiProperty } from '@nestjs/swagger';
import { UsersByRoleResponse } from './users-by-role.response';

export class DeletionBatchItemResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	status: string;

	@ApiProperty()
	name: string;

	@ApiProperty({ type: [UsersByRoleResponse] })
	usersByRole: UsersByRoleResponse[];

	@ApiProperty({ type: Date })
	createdAt: Date;

	@ApiProperty({ type: Date })
	updatedAt: Date;

	constructor(item: DeletionBatchItemResponse) {
		this.id = item.id;
		this.status = item.status;
		this.name = item.name;
		this.usersByRole = item.usersByRole;
		this.createdAt = item.createdAt;
		this.updatedAt = item.updatedAt;
	}
}
