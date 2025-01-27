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
	public url: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	public title: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	public description: string;

	@ApiPropertyOptional()
	public originalImageUrl?: string;

	@ApiPropertyOptional()
	public imageUrl?: string;

	@ApiProperty({ enum: MetaDataEntityType, enumName: 'MetaDataEntityType' })
	public type: MetaDataEntityType;

	@ApiPropertyOptional()
	@DecodeHtmlEntities()
	public parentTitle?: string;

	@ApiPropertyOptional({ enum: MetaDataEntityType, enumName: 'MetaDataEntityType' })
	public parentType?: MetaDataEntityType;
}
