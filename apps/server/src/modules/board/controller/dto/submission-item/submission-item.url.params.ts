import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class SubmissionItemUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the submission item.',
		required: true,
		nullable: false,
	})
	submissionItemId!: string;
}
