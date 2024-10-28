import { RoleName } from '@shared/domain/interface';

export class ExternalUserDto {
	externalId: string;

	firstName?: string;

	lastName?: string;

	email?: string;

	roles?: RoleName[];

	birthday?: Date;

	sessionToken?: string;

	constructor(props: ExternalUserDto) {
		this.externalId = props.externalId;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.email = props.email;
		this.roles = props.roles;
		this.birthday = props.birthday;
		this.sessionToken = props.sessionToken;
	}
}
