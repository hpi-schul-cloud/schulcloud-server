import { ApiProperty } from '@nestjs/swagger';
import { BoardExternalReferenceType } from '@shared/domain/domainobject/board/types/board-external-reference';

export class BoardContextResponse {
	constructor({ id, type }: BoardContextResponse) {
		this.id = id;
		this.type = type;
	}

	@ApiProperty({
		pattern: '[a-f0-9]{24}',
	})
	id: string;

	@ApiProperty({ enum: BoardExternalReferenceType, enumName: 'BoardExternalReferenceType' })
	type: BoardExternalReferenceType;
}
