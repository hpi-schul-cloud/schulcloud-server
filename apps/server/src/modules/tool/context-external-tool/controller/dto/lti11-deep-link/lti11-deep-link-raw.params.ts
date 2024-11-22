import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Equals, IsJSON, IsNumber, IsOptional, IsString } from 'class-validator';
import { Authorization } from 'oauth-1.0a';

export class Lti11DeepLinkParamsRaw implements Authorization {
	@Equals('ContentItemSelection')
	@ApiProperty()
	lti_message_type!: string;

	@Equals('LTI-1p0')
	@ApiProperty()
	lti_version!: string;

	@IsOptional()
	@IsJSON()
	@ApiPropertyOptional()
	content_items?: string;

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
