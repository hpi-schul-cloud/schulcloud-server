import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomParameterLocation } from '@src/modules/tool/interface/custom-parameter-location.enum';
import { CustomParameterScope } from '@src/modules/tool/interface/custom-parameter-scope.enum';
import { CustomParameterType } from '@src/modules/tool/interface/custom-parameter-type.enum';

export class CustomParameterCreateParams {
	@IsString()
	@ApiProperty()
	name!: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	default?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	regex?: string;

	@IsEnum(CustomParameterScope)
	@ApiProperty()
	scope!: CustomParameterScope;

	@IsEnum(CustomParameterLocation)
	@ApiProperty()
	location!: CustomParameterLocation;

	@IsEnum(CustomParameterType)
	@ApiProperty()
	type!: CustomParameterType;
}
