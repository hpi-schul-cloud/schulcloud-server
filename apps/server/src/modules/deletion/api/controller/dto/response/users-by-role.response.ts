import { ApiProperty } from '@nestjs/swagger';
// import { RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';

export class UsersByRoleResponse {
	@ApiProperty()
	roleName: string;

	@ApiProperty()
	ids: EntityId[];

	constructor(item: UsersByRoleResponse) {
		this.roleName = item.roleName;
		this.ids = item.ids;
	}
}
