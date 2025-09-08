import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class SubmissionUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the submission.',
		required: true,
		nullable: false,
	})
	submissionId!: string;
}
