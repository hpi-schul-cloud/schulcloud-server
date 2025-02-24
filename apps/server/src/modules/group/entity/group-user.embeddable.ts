import { Embeddable, ManyToOne } from '@mikro-orm/core';
import { User } from '@modules/user/repo';
import { Role } from '@shared/domain/entity/role.entity';

export interface GroupUserEntityProps {
	user: User;

	role: Role;
}

@Embeddable()
export class GroupUserEmbeddable {
	@ManyToOne(() => User)
	user: User;

	@ManyToOne(() => Role)
	role: Role;

	constructor(props: GroupUserEntityProps) {
		this.user = props.user;
		this.role = props.role;
	}
}
