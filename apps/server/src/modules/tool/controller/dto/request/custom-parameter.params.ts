import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CustomParameterLocation } from '@src/modules/tool/interface/custom-parameter-location.enum';
import { CustomParameterScope } from '@src/modules/tool/interface/custom-parameter-scope.enum';
import { CustomParameterType } from '@src/modules/tool/interface/custom-parameter-type.enum';

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
