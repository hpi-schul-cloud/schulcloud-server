import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';

export class LessonsUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the course the lesson belongs to.',
		required: true,
		nullable: false,
	})
	courseId!: EntityId;
}
