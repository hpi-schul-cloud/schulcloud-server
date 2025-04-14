import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';

export class SchoolInfoResponse {
	constructor({ id, name }: SchoolInfoResponse) {
		this.id = id;
		this.name = name;
	}

	@ApiProperty({
		pattern: bsonStringPattern,
		description: 'The id of the School entity',
	})
	id: string;

	@ApiProperty({
		description: 'The name of the School entity',
	})
	name: string;
}
