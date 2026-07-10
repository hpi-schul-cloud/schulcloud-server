import { type RoleDto } from '@modules/role/service/dto/role.dto';
import { type UserDo } from '@modules/user';

export class ResolvedGroupUser {
	user: UserDo;

	role: RoleDto;

	constructor(props: ResolvedGroupUser) {
		this.user = props.user;
		this.role = props.role;
	}
}
