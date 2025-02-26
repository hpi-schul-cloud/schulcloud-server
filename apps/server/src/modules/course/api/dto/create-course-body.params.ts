import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCourseBodyParams {
	@IsString()
	@ApiProperty({
		description: 'The title of the course',
		required: true,
		nullable: false,
	})
	public title!: string;
}
