import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';

export class UsersByRoleResponse {
	@ApiProperty()
	public roleName: string;

	@ApiProperty()
	public ids: EntityId[];

	constructor(item: UsersByRoleResponse) {
		this.roleName = item.roleName;
		this.ids = item.ids;
	}
}
