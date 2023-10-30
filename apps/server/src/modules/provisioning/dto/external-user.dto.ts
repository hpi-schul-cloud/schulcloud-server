import { RoleName } from '@shared/domain/interface/rolename.enum';

export class ExternalUserDto {
	externalId: string;

	firstName?: string;

	lastName?: string;

	email?: string;

	roles?: RoleName[];

	constructor(props: ExternalUserDto) {
		this.externalId = props.externalId;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.email = props.email;
		this.roles = props.roles;
	}
}
