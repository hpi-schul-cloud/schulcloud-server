import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class LessonUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the lesson.',
		required: true,
		nullable: false,
	})
	lessonId!: string;
}
