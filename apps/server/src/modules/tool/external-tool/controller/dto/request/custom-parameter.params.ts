import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
	CustomParameterLocationParams,
	CustomParameterScopeTypeParams,
	CustomParameterTypeParams,
} from '../../../../common/interface';

export class CustomParameterPostParams {
	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	name!: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	displayName!: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	description?: string;

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

	@IsEnum(CustomParameterScopeTypeParams)
	@ApiProperty()
	scope!: CustomParameterScopeTypeParams;

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
