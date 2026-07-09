import { type RoleName } from '@modules/role';

export class ExternalUserDto {
	externalId: string;

	erwinId?: string;

	firstName?: string;

	preferredName?: string;

	lastName?: string;

	email?: string;

	roles: RoleName[];

	birthday?: Date;

	constructor(props: ExternalUserDto) {
		this.externalId = props.externalId;
		this.erwinId = props.erwinId;
		this.firstName = props.firstName;
		this.preferredName = props.preferredName;
		this.lastName = props.lastName;
		this.email = props.email;
		this.roles = props.roles;
		this.birthday = props.birthday;
	}
}
