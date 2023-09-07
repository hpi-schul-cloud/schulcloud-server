import { Embeddable, ManyToOne } from '@mikro-orm/core';
import { Role, User } from '@shared/domain/entity';

export interface GroupUserEntityProps {
	user: User;

	role: Role;
}

@Embeddable()
export class GroupUserEntity {
	@ManyToOne(() => User)
	user: User;

	@ManyToOne(() => Role)
	role: Role;

	constructor(props: GroupUserEntityProps) {
		this.user = props.user;
		this.role = props.role;
	}
}
