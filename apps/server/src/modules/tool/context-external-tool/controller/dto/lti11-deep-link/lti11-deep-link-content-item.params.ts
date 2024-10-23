import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Lti11ContentItemType } from './lti11-content-item-type';
import { Lti11DeepLinkContentItemDurationParams } from './lti11-deep-link-content-item-duration.params';

export class Lti11DeepLinkContentItemParams {
	@IsEnum(Lti11ContentItemType)
	@ApiProperty()
	'@type'!: string;

	@IsString()
	@ApiProperty()
	mediaType!: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional()
	url?: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional()
	title?: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional()
	text?: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => Lti11DeepLinkContentItemDurationParams)
	@ApiPropertyOptional()
	available?: Lti11DeepLinkContentItemDurationParams;

	@IsOptional()
	@ValidateNested()
	@Type(() => Lti11DeepLinkContentItemDurationParams)
	@ApiPropertyOptional()
	submission?: Lti11DeepLinkContentItemDurationParams;

	@IsOptional()
	@IsObject()
	@ApiPropertyOptional()
	custom?: Record<string, string>;
}
