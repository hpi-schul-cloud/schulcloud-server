import { ApiProperty } from '@nestjs/swagger';

export class SchoolExistsResponse {
	@ApiProperty()
	exists: boolean;

	constructor(props: SchoolExistsResponse) {
		this.exists = props.exists;
	}
}
