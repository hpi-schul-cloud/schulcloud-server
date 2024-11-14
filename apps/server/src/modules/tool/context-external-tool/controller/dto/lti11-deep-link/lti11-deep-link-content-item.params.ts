import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { Lti11ContentItemType } from './lti11-content-item-type';

export class Lti11DeepLinkContentItemParams {
	@IsEnum(Lti11ContentItemType)
	@ApiProperty()
	'@type'!: Lti11ContentItemType;

	@IsString()
	@ApiProperty()
	mediaType!: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional()
	title?: string;

	@IsOptional()
	@IsObject()
	@IsString({ each: true })
	@ApiPropertyOptional()
	custom?: Record<string, string>;
}
