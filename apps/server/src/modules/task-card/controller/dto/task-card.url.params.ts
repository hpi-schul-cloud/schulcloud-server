import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class TaskCardUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the task card.',
		required: true,
		nullable: false,
	})
	id!: string;
}
