import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomParameterScopeParams } from '@src/modules/tool/interface/custom-parameter-scope.enum';
import { CustomParameterLocationParams } from '@src/modules/tool/interface/custom-parameter-location.enum';
import { CustomParameterTypeParams } from '@src/modules/tool/interface/custom-parameter-type.enum';

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

	@IsEnum(CustomParameterScopeParams)
	@ApiProperty()
	scope!: CustomParameterScopeParams;

	@IsEnum(CustomParameterLocationParams)
	@ApiProperty()
	location!: CustomParameterLocationParams;

	@IsEnum(CustomParameterTypeParams)
	@ApiProperty()
	type!: CustomParameterTypeParams;
}
