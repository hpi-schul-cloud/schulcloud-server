import { ApiProperty } from '@nestjs/swagger';
import { SystemForLdapLoginResponse } from './system-for-ldap-login.response';

export class SchoolForLdapLoginResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty({ type: [SystemForLdapLoginResponse] })
	systems: SystemForLdapLoginResponse[];

	constructor(props: SchoolForLdapLoginResponse) {
		this.id = props.id;
		this.name = props.name;
		this.systems = props.systems;
	}
}
