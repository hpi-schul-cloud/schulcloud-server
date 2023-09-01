import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class SubmissionContainerUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the submission container.',
		required: true,
		nullable: false,
	})
	submissionContainerId!: string;
}
