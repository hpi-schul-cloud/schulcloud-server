import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CourseUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the course',
		required: true,
		nullable: false,
	})
	courseId!: string;
}
