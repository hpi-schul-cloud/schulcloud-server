import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class TaskUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the task.',
		required: true,
		nullable: false,
	})
	taskId!: string;
}
