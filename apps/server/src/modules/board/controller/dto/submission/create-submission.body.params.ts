import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CreateSubmissionBodyParams {
	@IsBoolean()
	@ApiProperty({
		description: 'Boolean indicating whether the submission is completed.',
		required: true,
	})
	completed!: boolean;
}
