import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	CustomParameterLocationParams,
	CustomParameterScopeParams,
	CustomParameterTypeParams,
} from '../../../interface';

export class CustomParameterPostParams {
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
