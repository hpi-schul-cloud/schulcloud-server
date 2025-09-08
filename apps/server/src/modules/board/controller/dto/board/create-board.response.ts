import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';

export class CreateBoardResponse {
	constructor({ id }: CreateBoardResponse) {
		this.id = id;
	}

	@ApiProperty({
		pattern: bsonStringPattern,
	})
	id: string;
}
