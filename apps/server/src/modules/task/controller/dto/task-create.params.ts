import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';

export class TaskCreateParams {
	@IsString()
	@IsMongoId()
	@ApiProperty({
		description: 'The id of an course object.',
		pattern: '[a-f0-9]{24}',
		required: true,
		nullable: false,
	})
	courseId!: string;
}
