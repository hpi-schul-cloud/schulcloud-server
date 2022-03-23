import { ApiProperty } from '@nestjs/swagger';

export class SchoolInfoResponse {
	constructor({ id, name }: SchoolInfoResponse) {
		this.id = id;
		this.name = name;
	}

	@ApiProperty({
		pattern: '[a-f0-9]{24}',
		description: 'The id of the School entity',
	})
	id: string;

	@ApiProperty({
		description: 'The name of the School entity',
	})
	name: string;
}
