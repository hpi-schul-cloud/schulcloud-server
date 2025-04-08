import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { BoardExternalReferenceType } from '../../../domain';

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
