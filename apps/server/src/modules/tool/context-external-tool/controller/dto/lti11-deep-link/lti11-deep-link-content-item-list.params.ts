import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsString, ValidateNested } from 'class-validator';
import { Lti11DeepLinkContentItemParams } from './lti11-deep-link-content-item.params';

export class Lti11DeepLinkContentItemListParams {
	@IsString()
	@ApiProperty()
	'@context'!: string;

	@IsArray()
	@ArrayMaxSize(1)
	@ValidateNested({ each: true })
	@Type(() => Lti11DeepLinkContentItemParams)
	'@graph'!: Lti11DeepLinkContentItemParams[];
}
