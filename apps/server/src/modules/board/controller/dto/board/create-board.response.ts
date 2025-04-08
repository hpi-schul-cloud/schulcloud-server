import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '../bson-string-pattern';

export class CreateBoardResponse {
	constructor({ id }: CreateBoardResponse) {
		this.id = id;
	}

	@ApiProperty({
		pattern: bsonStringPattern,
	})
	id: string;
}
