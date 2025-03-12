import { RoleName } from '@modules/role';
import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';

export class UsersByRoleResponse {
	@ApiProperty()
	roleName: RoleName;

	@ApiProperty()
	ids: EntityId[];

	constructor(item: UsersByRoleResponse) {
		this.roleName = item.roleName;
		this.ids = item.ids;
	}
}
