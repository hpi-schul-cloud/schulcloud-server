import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Equals, IsOptional, ValidateNested } from 'class-validator';
import { Lti11DeepLinkContentItemListParams } from './lti11-deep-link-content-item-list.params';

export class Lti11DeepLinkParams {
	@Equals('ContentItemSelection')
	@ApiProperty()
	lti_message_type!: string;

	@Equals('LTI-1p0')
	@ApiProperty()
	lti_version!: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => Lti11DeepLinkContentItemListParams)
	@ApiPropertyOptional()
	content_items?: Lti11DeepLinkContentItemListParams;
}
