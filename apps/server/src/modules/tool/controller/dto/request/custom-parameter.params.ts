import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
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
	defaultValue?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	regex?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	regexComment?: string;

	@IsEnum(CustomParameterScopeParams)
	@ApiProperty()
	scope!: CustomParameterScopeParams;

	@IsEnum(CustomParameterLocationParams)
	@ApiProperty()
	location!: CustomParameterLocationParams;

	@IsEnum(CustomParameterTypeParams)
	@ApiProperty()
	type!: CustomParameterTypeParams;

	@IsBoolean()
	@ApiProperty()
	isOptional!: boolean;
}
