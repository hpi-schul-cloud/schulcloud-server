import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { PaginationResponse } from '@shared/controller';

export class LessonMetadataResponse {
	constructor({ _id, name }: LessonMetadataResponse) {
		this._id = _id;
		this.name = name;
	}

	@ApiProperty({
		description: 'The id of the Lesson entity',
		pattern: '[a-f0-9]{24}',
	})
	_id: EntityId;

	@ApiProperty({
		description: 'Name of the Lesson entity',
	})
	name: string;
}

export class LessonMetadataListResponse extends PaginationResponse<LessonMetadataResponse[]> {
	constructor(data: LessonMetadataResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [LessonMetadataResponse] })
	data: LessonMetadataResponse[];
}
