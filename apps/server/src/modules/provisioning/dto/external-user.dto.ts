import { RoleName } from '@shared/domain/interface';

export class ExternalUserDto {
	public externalId: string;

	public firstName?: string;

	public lastName?: string;

	public email?: string;

	public roles: RoleName[];

	public birthday?: Date;

	constructor(props: ExternalUserDto) {
		this.externalId = props.externalId;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.email = props.email;
		this.roles = props.roles;
		this.birthday = props.birthday;
	}
}
