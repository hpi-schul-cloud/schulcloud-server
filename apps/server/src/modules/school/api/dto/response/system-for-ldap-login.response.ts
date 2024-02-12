import { ApiProperty } from '@nestjs/swagger';

export class SystemForLdapLoginResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	type: string;

	@ApiProperty()
	alias?: string;

	constructor(props: SystemForLdapLoginResponse) {
		this.id = props.id;
		this.type = props.type;
		this.alias = props.alias;
	}
}
