import { RoleName } from '@modules/role';

export class ExternalUserDto {
	public externalId: string;

	public firstName?: string;

	public preferredName?: string;

	public lastName?: string;

	public email?: string;

	public roles: RoleName[];

	public birthday?: Date;

	constructor(props: ExternalUserDto) {
		this.externalId = props.externalId;
		this.firstName = props.firstName;
		this.preferredName = props.preferredName;
		this.lastName = props.lastName;
		this.email = props.email;
		this.roles = props.roles;
		this.birthday = props.birthday;
	}
}
