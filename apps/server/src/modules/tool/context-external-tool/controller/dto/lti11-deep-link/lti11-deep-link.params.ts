import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StringToObject } from '@shared/controller/transformer';
import { Type } from 'class-transformer';
import { Equals, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Lti11DeepLinkContentItemListParams } from './lti11-deep-link-content-item-list.params';

export class Lti11DeepLinkParams {
	@Equals('ContentItemSelection')
	@ApiProperty()
	lti_message_type!: string;

	@Equals('LTI-1p0')
	@ApiProperty()
	lti_version!: string;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@StringToObject(Lti11DeepLinkContentItemListParams)
	@Type(() => Lti11DeepLinkContentItemListParams)
	@ApiPropertyOptional()
	content_items?: Lti11DeepLinkContentItemListParams;

	@IsString()
	@ApiProperty()
	data!: string;

	@Equals('1.0')
	@ApiProperty()
	oauth_version!: string;

	@IsString()
	@ApiProperty()
	oauth_nonce!: string;

	@IsNumber()
	@ApiProperty()
	oauth_timestamp!: number;

	@Equals('HMAC-SHA1')
	@ApiProperty()
	oauth_signature_method!: string;

	@IsString()
	@ApiProperty()
	oauth_consumer_key!: string;

	@IsString()
	@ApiProperty()
	oauth_signature!: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional()
	oauth_callback?: string;
}
