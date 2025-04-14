import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { PaginationResponse } from '@shared/controller/dto';
import { EntityId } from '@shared/domain/types';
import { ComponentProperties, LessonEntity } from '../../repo';
import { LessonContentResponse } from './lesson-content.response';
import { MaterialResponse } from './material.response';

export class LessonMetadataResponse {
	constructor({ _id, name }: LessonMetadataResponse) {
		this._id = _id;
		this.name = name;
	}

	@ApiProperty({
		description: 'The id of the Lesson entity',
		pattern: bsonStringPattern,
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

export class LessonResponse {
	constructor(lesson: LessonEntity) {
		this.id = lesson.id;
		// @deprecated _id used in legacy client
		this._id = lesson.id;
		this.name = lesson.name;
		this.courseId = lesson.course?.id;
		this.courseGroupId = lesson.courseGroup?.id;
		this.hidden = lesson.hidden;
		this.contents = lesson
			.getLessonComponents()
			.map((content: ComponentProperties) => new LessonContentResponse(content));
		this.materials = lesson.getLessonMaterials().map((material) => new MaterialResponse(material));
		this.position = lesson.position;
	}

	@ApiProperty({
		description: 'The id of the Lesson entity',
		pattern: bsonStringPattern,
		deprecated: true,
	})
	_id: EntityId;

	@ApiProperty({
		description: 'The id of the Lesson entity',
		pattern: bsonStringPattern,
	})
	id: EntityId;

	@ApiProperty({
		description: 'Name of the Lesson entity',
	})
	name: string;

	@ApiPropertyOptional({
		description: 'The id of the Course entity',
		pattern: bsonStringPattern,
	})
	courseId?: EntityId;

	@ApiPropertyOptional({
		description: 'The id of the Course-group entity',
		pattern: bsonStringPattern,
	})
	courseGroupId?: EntityId;

	@ApiProperty({
		description: 'Hidden status of the Lesson entity',
	})
	hidden: boolean;

	@ApiProperty({
		description: 'Position of the Lesson entity',
	})
	position: number;

	@ApiProperty({
		description: 'Contents of the Lesson entity',
		type: [LessonContentResponse],
	})
	contents: LessonContentResponse[] | [];

	@ApiProperty({
		description: 'Materials of the Lesson entity',
		type: [MaterialResponse],
	})
	materials: MaterialResponse[] | [];
}
