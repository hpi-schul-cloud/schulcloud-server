import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class BoardSubmissionIdParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the submission container.',
		required: true,
		nullable: false,
	})
	submissionContainerId!: string;
}
