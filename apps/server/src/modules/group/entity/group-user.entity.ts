import { Embeddable, Property } from '@mikro-orm/core';
import { Role, User } from '@shared/domain';

export interface GroupUserEntityProps {
	user: User;

	role: Role;
}

@Embeddable()
export class GroupUserEntity {
	@Property()
	user: User;

	@Property()
	role: Role;

	constructor(props: GroupUserEntityProps) {
		this.user = props.user;
		this.role = props.role;
	}
}
