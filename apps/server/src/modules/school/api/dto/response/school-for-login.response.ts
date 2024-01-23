import { ApiProperty } from '@nestjs/swagger';

export class SchoolForLoginResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	systemIds: string[];

	constructor(props: SchoolForLoginResponse) {
		this.id = props.id;
		this.name = props.name;
		this.systemIds = props.systemIds;
	}
}
