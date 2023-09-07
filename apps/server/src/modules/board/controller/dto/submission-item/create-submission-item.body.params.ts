import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsString } from 'class-validator';
import { InputFormat } from '@shared/domain';

export class CreateSubmissionItemBodyParams {
	@IsBoolean()
	@ApiProperty({
		description: 'Boolean indicating whether the submission is completed.',
		required: true,
	})
	completed!: boolean;

	@IsString()
	caption!: string;

	@IsString()
	text!: string;

	@IsEnum(InputFormat)
	@ApiProperty()
	inputFormat!: InputFormat;
}
