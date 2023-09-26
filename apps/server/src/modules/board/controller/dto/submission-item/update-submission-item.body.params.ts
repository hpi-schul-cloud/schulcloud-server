import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSubmissionItemBodyParams {
	@IsBoolean()
	@ApiProperty({
		description: 'Boolean indicating whether the submission is completed.',
		required: true,
	})
	completed!: boolean;
}
