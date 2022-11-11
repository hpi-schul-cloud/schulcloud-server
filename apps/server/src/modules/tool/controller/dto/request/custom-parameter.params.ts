import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '@shared/domain';

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
	scope!: CustomParameterScope;

	@ApiProperty()
	location!: CustomParameterLocation;

	@ApiProperty()
	type!: CustomParameterType;
}
