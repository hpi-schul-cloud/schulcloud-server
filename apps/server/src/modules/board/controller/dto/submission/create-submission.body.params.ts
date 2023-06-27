import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionBodyParams {
	@ApiProperty({ default: false })
	completed!: boolean;
}
