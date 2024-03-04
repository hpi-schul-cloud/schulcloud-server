import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { PaginationResponse } from '@shared/controller';
import { ComponentProperties, LessonEntity } from '@shared/domain/entity';
import { MaterialResponse } from './material.response';
import { LessonContentResponse } from './lesson-content.response';

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
		pattern: '[a-f0-9]{24}',
		deprecated: true,
	})
	_id: EntityId;

	@ApiProperty({
		description: 'The id of the Lesson entity',
		pattern: '[a-f0-9]{24}',
	})
	id: EntityId;

	@ApiProperty({
		description: 'Name of the Lesson entity',
	})
	name: string;

	@ApiPropertyOptional({
		description: 'The id of the Course entity',
		pattern: '[a-f0-9]{24}',
	})
	courseId?: EntityId;

	@ApiPropertyOptional({
		description: 'The id of the Course-group entity',
		pattern: '[a-f0-9]{24}',
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
