import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller/transformer';
import { MetaDataEntityType } from '../../types';

export class MetaTagExtractorResponse {
	constructor({
		url,
		title,
		description,
		originalImageUrl,
		imageUrl,
		type,
		parentTitle,
		parentType,
	}: MetaTagExtractorResponse) {
		this.url = url;
		this.title = title;
		this.description = description;
		this.imageUrl = imageUrl;
		this.originalImageUrl = originalImageUrl;
		this.type = type;
		this.parentTitle = parentTitle;
		this.parentType = parentType;
	}

	@ApiProperty()
	url: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	title: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	description: string;

	@ApiPropertyOptional()
	originalImageUrl?: string;

	@ApiPropertyOptional()
	imageUrl?: string;

	@ApiProperty({ enum: MetaDataEntityType, enumName: 'MetaDataEntityType' })
	type: MetaDataEntityType;

	@ApiPropertyOptional()
	@DecodeHtmlEntities()
	parentTitle?: string;

	@ApiPropertyOptional({ enum: MetaDataEntityType, enumName: 'MetaDataEntityType' })
	parentType?: MetaDataEntityType;
}
