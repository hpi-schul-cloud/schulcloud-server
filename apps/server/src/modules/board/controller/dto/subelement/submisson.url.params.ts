import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class SubmissionUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the node.',
		required: true,
		nullable: false,
	})
	id!: string;
}
