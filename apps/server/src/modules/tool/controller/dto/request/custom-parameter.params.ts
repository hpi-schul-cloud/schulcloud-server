import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CustomParameterCreateParams {
	@IsString()
	@ApiProperty()
	name!: string;

	@IsString()
	@ApiProperty()
	default?: string;

	@IsString()
	@ApiProperty()
	regex?: string;

	@ApiProperty()
	scope!: string;

	@ApiProperty()
	location!: string;

	@ApiProperty()
	type!: string;
}
