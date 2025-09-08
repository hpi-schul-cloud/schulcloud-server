import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';

export class TargetInfoResponse {
	constructor({ id, name }: TargetInfoResponse) {
		this.id = id;
		this.name = name;
	}

	@ApiProperty({
		pattern: bsonStringPattern,
		description: 'The id of the Target entity',
	})
	id: string;

	@ApiProperty({
		description: 'The name of the Target entity',
	})
	name: string;
}
