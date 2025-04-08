import { ApiProperty } from '@nestjs/swagger';
import { BoardExternalReferenceType } from '../../../domain';
import { bsonStringPattern } from '../bson-string-pattern';

export class BoardContextResponse {
	constructor({ id, type }: BoardContextResponse) {
		this.id = id;
		this.type = type;
	}

	@ApiProperty({
		pattern: bsonStringPattern,
	})
	id: string;

	@ApiProperty({ enum: BoardExternalReferenceType, enumName: 'BoardExternalReferenceType' })
	type: BoardExternalReferenceType;
}
