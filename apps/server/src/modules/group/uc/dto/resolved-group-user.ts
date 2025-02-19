import { RoleDto } from '@modules/role/service/dto/role.dto';
import { UserDO } from '@modules/user/domain';

export class ResolvedGroupUser {
	user: UserDO;

	role: RoleDto;

	constructor(props: ResolvedGroupUser) {
		this.user = props.user;
		this.role = props.role;
	}
}
