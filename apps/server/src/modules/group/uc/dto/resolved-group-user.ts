import { UserDO } from '@shared/domain';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';

export class ResolvedGroupUser {
	user: UserDO;

	role: RoleDto;

	constructor(props: ResolvedGroupUser) {
		this.user = props.user;
		this.role = props.role;
	}
}
